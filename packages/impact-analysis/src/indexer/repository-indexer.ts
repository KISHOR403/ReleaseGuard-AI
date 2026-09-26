import ts from 'typescript';
import {
  IndexedFile,
  RepositoryIndex,
  RouteDefinition,
  PrismaModelDefinition,
} from './types';
import { RepositoryFile } from '../schemas/impact-analysis.schema';

export class RepositoryIndexer {
  indexRepository(files: RepositoryFile[]): RepositoryIndex {
    const fileMap = new Map<string, IndexedFile>();
    const symbolsToFiles = new Map<string, Set<string>>();
    const allRoutes: RouteDefinition[] = [];
    const tables = new Map<string, { table: string; columns: Set<string>; definedInFile?: string }>();
    const unknowns: Array<{ area: string; description: string; file?: string }> = [];

    // First pass: Index each file independently
    for (const file of files) {
      const normalizedPath = this.normalizePath(file.path);
      const extension = this.getExtension(normalizedPath);
      const language = file.language || this.inferLanguage(extension);

      const indexed: IndexedFile = {
        path: normalizedPath,
        extension,
        language,
        content: file.content,
        imports: [],
        exports: [],
        symbols: [],
        routes: [],
        sqlQueries: [],
        prismaModels: [],
      };

      if (['ts', 'tsx', 'js', 'jsx'].includes(extension)) {
        this.indexTypeScriptFile(indexed, unknowns);
      } else if (extension === 'sql') {
        this.indexSqlFile(indexed, tables);
      } else if (extension === 'prisma' || normalizedPath.endsWith('schema.prisma')) {
        this.indexPrismaFile(indexed, tables);
      }

      fileMap.set(normalizedPath, indexed);

      // Register symbols
      for (const sym of indexed.symbols) {
        if (!symbolsToFiles.has(sym.name)) {
          symbolsToFiles.set(sym.name, new Set());
        }
        symbolsToFiles.get(sym.name)!.add(normalizedPath);
      }

      // Register routes
      allRoutes.push(...indexed.routes);
    }

    // Second pass: Resolve import paths across the repository snapshot
    const allFilePaths = Array.from(fileMap.keys());
    for (const [path, indexed] of fileMap.entries()) {
      for (const imp of indexed.imports) {
        const resolved = this.resolveImportPath(path, imp.specifier, allFilePaths);
        if (resolved) {
          imp.resolvedPath = resolved;
        } else if (imp.specifier.startsWith('.') || imp.specifier.startsWith('/')) {
          unknowns.push({
            area: 'import_resolution',
            description: `Could not statically resolve local import "${imp.specifier}"`,
            file: path,
          });
        }
      }

      for (const exp of indexed.exports) {
        if (exp.reExportSpecifier) {
          const resolved = this.resolveImportPath(path, exp.reExportSpecifier, allFilePaths);
          if (resolved) {
            exp.resolvedReExportPath = resolved;
          }
        }
      }
    }

    return {
      files: fileMap,
      symbolsToFiles,
      routes: allRoutes,
      tables,
      unknowns,
    };
  }

  private indexTypeScriptFile(file: IndexedFile, unknowns: Array<{ area: string; description: string; file?: string }>): void {
    let sourceFile: ts.SourceFile;
    try {
      sourceFile = ts.createSourceFile(
        file.path,
        file.content,
        ts.ScriptTarget.Latest,
        true,
        file.extension.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );
    } catch (err) {
      unknowns.push({
        area: 'ast_parsing',
        description: `Failed to parse AST: ${(err as Error).message}`,
        file: file.path,
      });
      return;
    }

    let currentControllerPrefix = '';

    const visit = (node: ts.Node) => {
      // 1. Imports
      if (ts.isImportDeclaration(node)) {
        if (ts.isStringLiteral(node.moduleSpecifier)) {
          const specifier = node.moduleSpecifier.text;
          const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          const snippet = node.getText(sourceFile).trim();

          const importedSymbols: string[] = [];
          let isDefault = false;
          let isNamespace = false;

          if (node.importClause) {
            if (node.importClause.name) {
              isDefault = true;
              importedSymbols.push(node.importClause.name.text);
            }
            if (node.importClause.namedBindings) {
              if (ts.isNamespaceImport(node.importClause.namedBindings)) {
                isNamespace = true;
                importedSymbols.push(node.importClause.namedBindings.name.text);
              } else if (ts.isNamedImports(node.importClause.namedBindings)) {
                for (const elem of node.importClause.namedBindings.elements) {
                  importedSymbols.push(elem.name.text);
                }
              }
            }
          }

          file.imports.push({
            specifier,
            importedSymbols,
            isDefault,
            isNamespace,
            isCommonJs: false,
            line,
            snippet,
          });
        }
      }

      // CommonJS require: const foo = require('./foo')
      if (ts.isCallExpression(node)) {
        if (ts.isIdentifier(node.expression) && node.expression.text === 'require' && node.arguments.length > 0) {
          const firstArg = node.arguments[0];
          if (ts.isStringLiteral(firstArg)) {
            const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            file.imports.push({
              specifier: firstArg.text,
              importedSymbols: [],
              isDefault: true,
              isNamespace: false,
              isCommonJs: true,
              line,
              snippet: node.getText(sourceFile),
            });
          }
        }

        // Prisma client call detection: prisma.payment.create(...) or this.prisma.order.findMany(...)
        this.detectPrismaCall(node, sourceFile, file);
      }

      // 2. Exports
      if (ts.isExportDeclaration(node)) {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        const exportedSymbols: string[] = [];
        let reExportSpecifier: string | undefined;

        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          reExportSpecifier = node.moduleSpecifier.text;
        }

        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          for (const elem of node.exportClause.elements) {
            exportedSymbols.push(elem.name.text);
          }
        }

        file.exports.push({
          exportedSymbols,
          reExportSpecifier,
          line,
        });
      }

      // 3. Class definitions and NestJS controller detection
      if (ts.isClassDeclaration(node)) {
        const className = node.name?.text || 'AnonymousClass';
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        const isExported = Boolean(
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        );

        file.symbols.push({
          name: className,
          kind: 'class',
          line,
          exported: isExported,
        });

        // Check NestJS @Controller decorator
        currentControllerPrefix = this.extractControllerPrefix(node);

        // Scan methods inside class
        for (const member of node.members) {
          if (ts.isMethodDeclaration(member)) {
            const methodName = member.name.getText(sourceFile);
            const methodLine = sourceFile.getLineAndCharacterOfPosition(member.getStart()).line + 1;

            file.symbols.push({
              name: methodName,
              kind: 'method',
              line: methodLine,
              exported: isExported,
              parent: className,
            });

            // Check NestJS HTTP Method decorators (@Get, @Post, etc.)
            const route = this.extractNestRoute(member, currentControllerPrefix, sourceFile, className);
            if (route) {
              file.routes.push(route);
            }
          }
        }
      }

      // 4. Function definitions
      if (ts.isFunctionDeclaration(node) && node.name) {
        const funcName = node.name.text;
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        const isExported = Boolean(
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        );

        file.symbols.push({
          name: funcName,
          kind: 'function',
          line,
          exported: isExported,
        });
      }

      // 5. Interface definitions
      if (ts.isInterfaceDeclaration(node)) {
        const name = node.name.text;
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        file.symbols.push({
          name,
          kind: 'interface',
          line,
          exported: Boolean(node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)),
        });
      }

      // 6. SQL Queries inside string literals
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        this.detectSqlInString(node.text, sourceFile, node, file);
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  private extractControllerPrefix(classNode: ts.ClassDeclaration): string {
    const decorators = ts.canHaveDecorators(classNode) ? ts.getDecorators(classNode) : undefined;
    if (!decorators) return '';

    for (const dec of decorators) {
      if (ts.isCallExpression(dec.expression)) {
        const expr = dec.expression;
        if (ts.isIdentifier(expr.expression) && expr.expression.text === 'Controller') {
          if (expr.arguments.length > 0 && ts.isStringLiteral(expr.arguments[0])) {
            let prefix = expr.arguments[0].text;
            if (!prefix.startsWith('/')) prefix = `/${prefix}`;
            if (prefix.endsWith('/')) prefix = prefix.slice(0, -1);
            return prefix;
          }
        }
      }
    }
    return '';
  }

  private extractNestRoute(
    methodNode: ts.MethodDeclaration,
    prefix: string,
    sourceFile: ts.SourceFile,
    className: string
  ): RouteDefinition | null {
    const decorators = ts.canHaveDecorators(methodNode) ? ts.getDecorators(methodNode) : undefined;
    if (!decorators) return null;

    const httpMethods = ['Get', 'Post', 'Put', 'Patch', 'Delete', 'Options', 'Head'];

    for (const dec of decorators) {
      if (ts.isCallExpression(dec.expression)) {
        const expr = dec.expression;
        if (ts.isIdentifier(expr.expression) && httpMethods.includes(expr.expression.text)) {
          const httpMethod = expr.expression.text.toUpperCase();
          let pathPart = '';
          if (expr.arguments.length > 0 && ts.isStringLiteral(expr.arguments[0])) {
            pathPart = expr.arguments[0].text;
          }
          if (pathPart && !pathPart.startsWith('/')) pathPart = `/${pathPart}`;
          const fullPath = `${prefix}${pathPart}` || '/';
          const line = sourceFile.getLineAndCharacterOfPosition(methodNode.getStart()).line + 1;

          return {
            method: httpMethod,
            path: fullPath,
            handlerSymbol: `${className}.${methodNode.name.getText(sourceFile)}`,
            line,
            snippet: methodNode.getText(sourceFile).slice(0, 100),
          };
        }
      }
    }
    return null;
  }

  private detectSqlInString(text: string, sourceFile: ts.SourceFile, node: ts.Node, file: IndexedFile): void {
    const trimmed = text.trim();
    const selectMatch = trimmed.match(/^SELECT\s+([\s\S]+?)\s+FROM\s+([a-zA-Z0-9_]+)/i);
    const insertMatch = trimmed.match(/^INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i);
    const updateMatch = trimmed.match(/^UPDATE\s+([a-zA-Z0-9_]+)/i);
    const deleteMatch = trimmed.match(/^DELETE\s+FROM\s+([a-zA-Z0-9_]+)/i);

    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

    if (selectMatch) {
      const columnsPart = selectMatch[1].trim();
      const table = selectMatch[2].toLowerCase();
      const columns = columnsPart === '*' ? [] : columnsPart.split(',').map((c) => c.trim().replace(/^.*\./, ''));
      file.sqlQueries.push({
        operation: 'READ',
        table,
        columns,
        line,
        snippet: trimmed.slice(0, 120),
      });
    } else if (insertMatch) {
      file.sqlQueries.push({
        operation: 'WRITE',
        table: insertMatch[1].toLowerCase(),
        columns: [],
        line,
        snippet: trimmed.slice(0, 120),
      });
    } else if (updateMatch) {
      file.sqlQueries.push({
        operation: 'WRITE',
        table: updateMatch[1].toLowerCase(),
        columns: [],
        line,
        snippet: trimmed.slice(0, 120),
      });
    } else if (deleteMatch) {
      file.sqlQueries.push({
        operation: 'WRITE',
        table: deleteMatch[1].toLowerCase(),
        columns: [],
        line,
        snippet: trimmed.slice(0, 120),
      });
    }
  }

  private detectPrismaCall(node: ts.CallExpression, sourceFile: ts.SourceFile, file: IndexedFile): void {
    // Looks for: this.prisma.<model>.<action>(...) or prisma.<model>.<action>(...)
    if (ts.isPropertyAccessExpression(node.expression)) {
      const actionName = node.expression.name.text;
      const parentExpr = node.expression.expression;

      if (ts.isPropertyAccessExpression(parentExpr)) {
        const modelName = parentExpr.name.text;
        const rootExpr = parentExpr.expression;

        const isPrisma =
          (ts.isIdentifier(rootExpr) && rootExpr.text.toLowerCase().includes('prisma')) ||
          (ts.isPropertyAccessExpression(rootExpr) && rootExpr.name.text.toLowerCase().includes('prisma'));

        if (isPrisma) {
          const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          const isWrite = ['create', 'update', 'delete', 'upsert', 'createMany', 'updateMany', 'deleteMany'].includes(
            actionName
          );
          file.sqlQueries.push({
            operation: isWrite ? 'WRITE' : 'READ',
            table: modelName.toLowerCase() + 's', // e.g. payment -> payments
            columns: [],
            line,
            snippet: node.getText(sourceFile).slice(0, 120),
          });
        }
      }
    }
  }

  private indexSqlFile(
    file: IndexedFile,
    tablesMap: Map<string, { table: string; columns: Set<string>; definedInFile?: string }>
  ): void {
    const lines = file.content.split('\n');
    let currentTable = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      // CREATE TABLE
      const createMatch = line.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i);
      if (createMatch) {
        currentTable = createMatch[1].toLowerCase();
        if (!tablesMap.has(currentTable)) {
          tablesMap.set(currentTable, { table: currentTable, columns: new Set(), definedInFile: file.path });
        }
        continue;
      }

      // ALTER TABLE payments ADD COLUMN currency ...
      const alterAddMatch = line.match(
        /ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+ADD\s+(?:COLUMN\s+)?([a-zA-Z0-9_]+)/i
      );
      if (alterAddMatch) {
        const tbl = alterAddMatch[1].toLowerCase();
        const col = alterAddMatch[2].toLowerCase();
        if (!tablesMap.has(tbl)) {
          tablesMap.set(tbl, { table: tbl, columns: new Set(), definedInFile: file.path });
        }
        tablesMap.get(tbl)!.columns.add(col);

        file.sqlQueries.push({
          operation: 'WRITE',
          table: tbl,
          columns: [col],
          line: lineNum,
          snippet: line,
        });
        continue;
      }

      // Column definitions inside CREATE TABLE
      if (currentTable && line.includes('(')) continue;
      if (currentTable && line.startsWith(')')) {
        currentTable = '';
        continue;
      }
      if (currentTable) {
        const colMatch = line.match(/^([a-zA-Z0-9_]+)\s+[a-zA-Z0-9_()]+/i);
        if (colMatch && !['primary', 'foreign', 'constraint', 'unique', 'check'].includes(colMatch[1].toLowerCase())) {
          tablesMap.get(currentTable)?.columns.add(colMatch[1].toLowerCase());
        }
      }
    }
  }

  private indexPrismaFile(
    file: IndexedFile,
    tablesMap: Map<string, { table: string; columns: Set<string>; definedInFile?: string }>
  ): void {
    const lines = file.content.split('\n');
    let currentModel: PrismaModelDefinition | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      const modelMatch = line.match(/^model\s+([a-zA-Z0-9_]+)\s*\{/i);
      if (modelMatch) {
        const modelName = modelMatch[1];
        const tableName = modelName.toLowerCase() + 's';
        currentModel = {
          name: modelName,
          tableName,
          fields: [],
          line: lineNum,
        };
        file.prismaModels.push(currentModel);
        if (!tablesMap.has(tableName)) {
          tablesMap.set(tableName, { table: tableName, columns: new Set(), definedInFile: file.path });
        }
        continue;
      }

      if (currentModel && line.startsWith('}')) {
        currentModel = null;
        continue;
      }

      if (currentModel && line && !line.startsWith('//') && !line.startsWith('@@')) {
        const fieldMatch = line.match(/^([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_?\[\]]+)/);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          const fieldType = fieldMatch[2];
          currentModel.fields.push({ name: fieldName, type: fieldType });
          tablesMap.get(currentModel.tableName)?.columns.add(fieldName.toLowerCase());
        }
      }
    }
  }

  private resolveImportPath(currentFile: string, specifier: string, allFiles: string[]): string | undefined {
    if (!specifier.startsWith('.')) {
      // Non-relative import or alias
      return undefined;
    }

    const currentDir = currentFile.includes('/') ? currentFile.substring(0, currentFile.lastIndexOf('/')) : '';
    const parts = (currentDir ? `${currentDir}/${specifier}` : specifier).split('/');
    const resolvedParts: string[] = [];

    for (const part of parts) {
      if (part === '.' || part === '') continue;
      if (part === '..') {
        resolvedParts.pop();
      } else {
        resolvedParts.push(part);
      }
    }

    const basePath = resolvedParts.join('/');
    const candidates = [
      basePath,
      `${basePath}.ts`,
      `${basePath}.tsx`,
      `${basePath}.js`,
      `${basePath}.jsx`,
      `${basePath}/index.ts`,
      `${basePath}/index.js`,
    ];

    for (const candidate of candidates) {
      if (allFiles.includes(candidate)) {
        return candidate;
      }
    }

    return undefined;
  }

  private normalizePath(path: string): string {
    let p = path.replace(/\\/g, '/');
    if (p.startsWith('./')) p = p.slice(2);
    return p;
  }

  private getExtension(path: string): string {
    const dotIdx = path.lastIndexOf('.');
    return dotIdx !== -1 ? path.slice(dotIdx + 1).toLowerCase() : '';
  }

  private inferLanguage(ext: string): string {
    const map: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      sql: 'sql',
      prisma: 'prisma',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
    };
    return map[ext] || 'unknown';
  }
}

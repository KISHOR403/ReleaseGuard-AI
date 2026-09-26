import { RepositoryIndex } from '../indexer/types';
import { DatabaseImpact, Evidence } from '../schemas/impact-analysis.schema';

export class DatabaseImpactAnalyzer {
  analyzeDatabaseImpact(
    changedFiles: string[],
    index: RepositoryIndex
  ): DatabaseImpact[] {
    const impacts: DatabaseImpact[] = [];
    const changedTables = new Set<string>();
    const changedColumns = new Map<string, Set<string>>(); // table -> Set<column>

    // 1. Inspect changed SQL files and migrations
    for (const changedPath of changedFiles) {
      const file = index.files.get(changedPath);
      if (!file) continue;

      if (file.extension === 'sql' || changedPath.includes('migration') || changedPath.includes('db/')) {
        for (const query of file.sqlQueries) {
          changedTables.add(query.table);
          if (!changedColumns.has(query.table)) {
            changedColumns.set(query.table, new Set());
          }
          for (const col of query.columns) {
            changedColumns.get(query.table)!.add(col);
          }
        }
      }

      if (file.extension === 'prisma' || changedPath.endsWith('schema.prisma')) {
        for (const model of file.prismaModels) {
          changedTables.add(model.tableName);
        }
      }
    }

    // Also include any tables from index where DDL was detected in changed files
    for (const [tblName, tblInfo] of index.tables.entries()) {
      if (tblInfo.definedInFile && changedFiles.includes(tblInfo.definedInFile)) {
        changedTables.add(tblName);
        if (!changedColumns.has(tblName)) {
          changedColumns.set(tblName, new Set());
        }
        for (const col of tblInfo.columns) {
          changedColumns.get(tblName)!.add(col);
        }
      }
    }

    // 2. For each changed table, find consumers across all repository files
    for (const table of changedTables) {
      const consumers: DatabaseImpact['consumers'] = [];
      const evidenceList: Evidence[] = [];

      // Find consumers in SQL queries
      for (const [filePath, file] of index.files.entries()) {
        if (changedFiles.includes(filePath) && (file.extension === 'sql' || filePath.includes('migration'))) {
          // Skip the migration itself as consumer
          continue;
        }

        // Check SQL queries in TS/JS files
        for (const q of file.sqlQueries) {
          if (q.table.toLowerCase() === table.toLowerCase()) {
            const componentName = this.findComponentName(file, q.line);
            consumers.push({
              component: componentName,
              filePath,
              operation: q.operation,
              line: q.line,
              snippet: q.snippet,
            });

            evidenceList.push({
              sourceType: 'QUERY',
              filePath,
              lineStart: q.line,
              lineEnd: q.line,
              symbol: componentName,
              snippet: q.snippet,
              description: `${componentName} performs ${q.operation} query on table "${table}"`,
            });
          }
        }

        // Check repository naming associations (e.g. PaymentRepository for payments table)
        for (const sym of file.symbols) {
          if (
            sym.kind === 'class' &&
            sym.name.toLowerCase().includes(table.replace(/s$/, '')) &&
            sym.name.toLowerCase().includes('repository')
          ) {
            const alreadyAdded = consumers.some((c) => c.component === sym.name && c.filePath === filePath);
            if (!alreadyAdded) {
              consumers.push({
                component: sym.name,
                filePath,
                operation: 'REFERENCE',
                line: sym.line,
                snippet: `class ${sym.name}`,
              });

              evidenceList.push({
                sourceType: 'AST',
                filePath,
                lineStart: sym.line,
                lineEnd: sym.line,
                symbol: sym.name,
                snippet: `class ${sym.name}`,
                description: `Repository component ${sym.name} maps to entity "${table}"`,
              });
            }
          }
        }
      }

      // Record Table impact
      impacts.push({
        entityType: 'TABLE',
        name: table,
        tableName: table,
        changeType: 'MODIFIED',
        consumers,
        evidence: evidenceList,
        confidence: 0.95,
      });

      // Record Column impacts if specific columns changed
      const cols = changedColumns.get(table);
      if (cols) {
        for (const col of cols) {
          const colConsumers = consumers.filter((c) =>
            c.snippet ? c.snippet.toLowerCase().includes(col.toLowerCase()) : false
          );

          impacts.push({
            entityType: 'COLUMN',
            name: `${table}.${col}`,
            tableName: table,
            changeType: 'ADDED',
            consumers: colConsumers,
            evidence: [
              {
                sourceType: 'DATABASE',
                description: `Column "${col}" was added or modified in table "${table}"`,
              },
            ],
            confidence: 0.95,
          });
        }
      }
    }

    return impacts;
  }

  private findComponentName(file: { symbols: Array<{ name: string; kind: string; line: number }> }, _line: number): string {
    // Find closest class or function enclosing this line
    let closest = file.symbols.find((s) => s.kind === 'class');
    if (!closest) {
      closest = file.symbols.find((s) => s.kind === 'function');
    }
    return closest ? closest.name : 'UnknownComponent';
  }
}

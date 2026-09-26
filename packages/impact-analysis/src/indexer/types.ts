export interface ImportStatement {
  specifier: string;
  resolvedPath?: string;
  importedSymbols: string[];
  isDefault: boolean;
  isNamespace: boolean;
  isCommonJs: boolean;
  line: number;
  snippet: string;
}

export interface ExportStatement {
  exportedSymbols: string[];
  reExportSpecifier?: string;
  resolvedReExportPath?: string;
  line: number;
}

export interface SymbolDefinition {
  name: string;
  kind: 'class' | 'function' | 'interface' | 'variable' | 'method' | 'model';
  line: number;
  exported: boolean;
  parent?: string;
}

export interface RouteDefinition {
  method: string;
  path: string;
  handlerSymbol?: string;
  line: number;
  snippet: string;
}

export interface SqlQueryReference {
  operation: 'READ' | 'WRITE' | 'REFERENCE';
  table: string;
  columns: string[];
  line: number;
  snippet: string;
}

export interface PrismaModelDefinition {
  name: string;
  tableName: string;
  fields: Array<{ name: string; type: string }>;
  line: number;
}

export interface IndexedFile {
  path: string;
  extension: string;
  language: string;
  content: string;
  imports: ImportStatement[];
  exports: ExportStatement[];
  symbols: SymbolDefinition[];
  routes: RouteDefinition[];
  sqlQueries: SqlQueryReference[];
  prismaModels: PrismaModelDefinition[];
}

export interface RepositoryIndex {
  files: Map<string, IndexedFile>;
  symbolsToFiles: Map<string, Set<string>>;
  routes: RouteDefinition[];
  tables: Map<string, { table: string; columns: Set<string>; definedInFile?: string }>;
  unknowns: Array<{ area: string; description: string; file?: string }>;
}

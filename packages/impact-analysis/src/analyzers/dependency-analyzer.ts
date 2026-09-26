import { RepositoryIndex } from '../indexer/types';
import { Evidence } from '../schemas/impact-analysis.schema';

export interface FileDependencyEdge {
  source: string; // The importer (e.g. src/order/order.service.ts)
  target: string; // The imported module (e.g. src/payment/payment.service.ts)
  importedSymbols: string[];
  line: number;
  snippet: string;
}

export interface DependencyGraph {
  forward: Map<string, FileDependencyEdge[]>; // file -> what it imports
  reverse: Map<string, FileDependencyEdge[]>; // file -> what imports it
}

export class DependencyAnalyzer {
  buildDependencyGraph(index: RepositoryIndex): DependencyGraph {
    const forward = new Map<string, FileDependencyEdge[]>();
    const reverse = new Map<string, FileDependencyEdge[]>();

    // Initialize maps for all indexed files
    for (const filePath of index.files.keys()) {
      forward.set(filePath, []);
      reverse.set(filePath, []);
    }

    for (const [filePath, file] of index.files.entries()) {
      // Process imports
      for (const imp of file.imports) {
        if (imp.resolvedPath && index.files.has(imp.resolvedPath)) {
          const edge: FileDependencyEdge = {
            source: filePath,
            target: imp.resolvedPath,
            importedSymbols: imp.importedSymbols,
            line: imp.line,
            snippet: imp.snippet,
          };

          forward.get(filePath)?.push(edge);
          reverse.get(imp.resolvedPath)?.push(edge);
        }
      }

      // Process re-exports: export * from './foo' or export { Bar } from './foo'
      for (const exp of file.exports) {
        if (exp.resolvedReExportPath && index.files.has(exp.resolvedReExportPath)) {
          const edge: FileDependencyEdge = {
            source: filePath,
            target: exp.resolvedReExportPath,
            importedSymbols: exp.exportedSymbols,
            line: exp.line,
            snippet: `export from ${exp.reExportSpecifier}`,
          };

          forward.get(filePath)?.push(edge);
          reverse.get(exp.resolvedReExportPath)?.push(edge);
        }
      }
    }

    return { forward, reverse };
  }

  createImportEvidence(edge: FileDependencyEdge): Evidence {
    const symbols = edge.importedSymbols.length > 0 ? edge.importedSymbols.join(', ') : 'module';
    return {
      sourceType: 'IMPORT',
      filePath: edge.source,
      lineStart: edge.line,
      lineEnd: edge.line,
      symbol: edge.importedSymbols[0],
      snippet: edge.snippet,
      description: `Static import of ${symbols} from ${edge.target}`,
    };
  }
}

export interface DiffStatistics {
  additions: number;
  deletions: number;
  changedLines: number;
  addedFunctions: string[];
  removedFunctions: string[];
  changedImports: string[];
  changedExports: string[];
  changedEnvReferences: string[];
  changedDependencies: string[];
}

export class DiffAnalyzer {
  static analyze(patch?: string): DiffStatistics {
    if (!patch) {
      return {
        additions: 0,
        deletions: 0,
        changedLines: 0,
        addedFunctions: [],
        removedFunctions: [],
        changedImports: [],
        changedExports: [],
        changedEnvReferences: [],
        changedDependencies: [],
      };
    }

    const lines = patch.split('\n');
    let additions = 0;
    let deletions = 0;
    const addedFunctions: string[] = [];
    const removedFunctions: string[] = [];
    const changedImports: string[] = [];
    const changedExports: string[] = [];
    const changedEnvReferences: Set<string> = new Set();
    const changedDependencies: string[] = [];

    // Regex patterns
    const fnPattern = /(?:async\s+)?(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:public|private|protected)?\s*(?:async\s*)?([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*[:{]|def\s+([a-zA-Z0-9_$]+)\s*\()/;
    const importPattern = /^\s*(?:import\s+.*?from\s+['"]([^'"]+)['"]|const\s+.*?=\s*require\(['"]([^'"]+)['"]\))/;
    const exportPattern = /^\s*export\s+(?:default\s+)?(?:const|let|var|function|class|type|interface)?\s*([a-zA-Z0-9_$]+)?/;
    const envPattern = /(?:process\.env\.([A-Z0-9_]+)|config\.get\(['"]([A-Z0-9_]+)['"]\))/g;
    const depPattern = /"([@a-zA-Z0-9_/-]+)"\s*:\s*"([^"]+)"/;

    for (const rawLine of lines) {
      if (rawLine.startsWith('+++') || rawLine.startsWith('---')) {
        continue;
      }

      if (rawLine.startsWith('+')) {
        additions++;
        const content = rawLine.substring(1).trim();

        // Added function
        const fnMatch = content.match(fnPattern);
        if (fnMatch) {
          const fnName = fnMatch[1] || fnMatch[2] || fnMatch[3] || fnMatch[4];
          if (fnName && !['if', 'for', 'while', 'switch', 'catch'].includes(fnName)) {
            addedFunctions.push(fnName);
          }
        }

        // Added import
        const impMatch = content.match(importPattern);
        if (impMatch) {
          const mod = impMatch[1] || impMatch[2];
          if (mod) changedImports.push(`+ ${mod}`);
        }

        // Added export
        const expMatch = content.match(exportPattern);
        if (expMatch && expMatch[1]) {
          changedExports.push(`+ ${expMatch[1]}`);
        }

        // Added dependency
        const depMatch = content.match(depPattern);
        if (depMatch) {
          changedDependencies.push(`+ ${depMatch[1]}@${depMatch[2]}`);
        }
      } else if (rawLine.startsWith('-')) {
        deletions++;
        const content = rawLine.substring(1).trim();

        // Removed function
        const fnMatch = content.match(fnPattern);
        if (fnMatch) {
          const fnName = fnMatch[1] || fnMatch[2] || fnMatch[3] || fnMatch[4];
          if (fnName && !['if', 'for', 'while', 'switch', 'catch'].includes(fnName)) {
            removedFunctions.push(fnName);
          }
        }

        // Removed import
        const impMatch = content.match(importPattern);
        if (impMatch) {
          const mod = impMatch[1] || impMatch[2];
          if (mod) changedImports.push(`- ${mod}`);
        }

        // Removed export
        const expMatch = content.match(exportPattern);
        if (expMatch && expMatch[1]) {
          changedExports.push(`- ${expMatch[1]}`);
        }

        // Removed dependency
        const depMatch = content.match(depPattern);
        if (depMatch) {
          changedDependencies.push(`- ${depMatch[1]}@${depMatch[2]}`);
        }
      }

      // Check env vars on all changed lines (+ or -)
      if (rawLine.startsWith('+') || rawLine.startsWith('-')) {
        let match: RegExpExecArray | null;
        while ((match = envPattern.exec(rawLine)) !== null) {
          const envVar = match[1] || match[2];
          if (envVar) changedEnvReferences.add(envVar);
        }
      }
    }

    return {
      additions,
      deletions,
      changedLines: additions + deletions,
      addedFunctions: Array.from(new Set(addedFunctions)),
      removedFunctions: Array.from(new Set(removedFunctions)),
      changedImports: Array.from(new Set(changedImports)),
      changedExports: Array.from(new Set(changedExports)),
      changedEnvReferences: Array.from(changedEnvReferences),
      changedDependencies: Array.from(new Set(changedDependencies)),
    };
  }
}

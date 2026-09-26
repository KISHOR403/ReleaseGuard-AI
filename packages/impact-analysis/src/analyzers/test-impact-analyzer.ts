import { RepositoryIndex } from '../indexer/types';
import { TestImpact } from '../schemas/impact-analysis.schema';
import { TraversalResult } from './transitive-traversal';
import { ApiImpact } from '../schemas/impact-analysis.schema';

export class TestImpactAnalyzer {
  analyzeTestImpact(
    traversal: TraversalResult,
    index: RepositoryIndex,
    apiImpacts: ApiImpact[],
    heuristicCandidates: string[] = []
  ): TestImpact[] {
    const impacts: TestImpact[] = [];
    const testFiles = Array.from(index.files.keys()).filter((p) => this.isTestFile(p));

    for (const testPath of testFiles) {
      const file = index.files.get(testPath);
      if (!file) continue;

      const testType = this.classifyTestType(testPath);
      let matched = false;

      // 1. Check for verified static imports of changed or affected files
      for (const imp of file.imports) {
        if (imp.resolvedPath && traversal.nodesByPath.has(imp.resolvedPath)) {
          const targetNode = traversal.nodesByPath.get(imp.resolvedPath)!;
          const targetComponent = imp.importedSymbols[0] || imp.resolvedPath.split('/').pop()?.replace(/\.[^.]+$/, '');

          impacts.push({
            testFile: testPath,
            testType,
            targetComponent,
            targetPath: imp.resolvedPath,
            relationship: 'VERIFIED_IMPORT',
            impactDepth: targetNode.depth,
            evidence: [
              {
                sourceType: 'TEST',
                filePath: testPath,
                lineStart: imp.line,
                lineEnd: imp.line,
                symbol: targetComponent,
                snippet: imp.snippet,
                description: `Test imports ${targetComponent} from ${imp.resolvedPath} (impact depth: ${targetNode.depth})`,
              },
            ],
            confidence: 1.0,
          });
          matched = true;
          break; // Avoid duplicate entries for same test file
        }
      }

      if (matched) continue;

      // 2. Check for API route reference match in test content
      for (const api of apiImpacts) {
        if (file.content.includes(api.path)) {
          impacts.push({
            testFile: testPath,
            testType,
            targetComponent: `${api.method} ${api.path}`,
            targetPath: api.path,
            relationship: 'API_ROUTE_MATCH',
            impactDepth: 1,
            evidence: [
              {
                sourceType: 'TEST',
                filePath: testPath,
                snippet: `References endpoint: ${api.method} ${api.path}`,
                description: `Test references affected endpoint ${api.method} ${api.path}`,
              },
            ],
            confidence: 0.9,
          });
          matched = true;
          break;
        }
      }

      if (matched) continue;

      // 3. Check for heuristic naming from candidate tests
      for (const candidate of heuristicCandidates) {
        if (testPath.includes(candidate) || candidate.includes(testPath)) {
          impacts.push({
            testFile: testPath,
            testType,
            targetPath: candidate,
            relationship: 'HEURISTIC_NAMING',
            impactDepth: 0,
            evidence: [
              {
                sourceType: 'TEST',
                filePath: testPath,
                description: `Test filename matches candidate test convention for changed source`,
              },
            ],
            confidence: 0.8,
          });
          break;
        }
      }
    }

    return impacts;
  }

  private isTestFile(path: string): boolean {
    const lower = path.toLowerCase();
    return (
      lower.includes('.test.') ||
      lower.includes('.spec.') ||
      lower.startsWith('test/') ||
      lower.startsWith('tests/') ||
      lower.includes('__tests__')
    );
  }

  private classifyTestType(path: string): 'UNIT' | 'INTEGRATION' | 'E2E' | 'UNKNOWN' {
    const lower = path.toLowerCase();
    if (lower.includes('e2e') || lower.includes('system')) {
      return 'E2E';
    }
    if (lower.includes('integration') || lower.includes('.it.') || lower.includes('spec')) {
      return 'INTEGRATION';
    }
    if (lower.includes('test') || lower.includes('unit')) {
      return 'UNIT';
    }
    return 'UNKNOWN';
  }
}

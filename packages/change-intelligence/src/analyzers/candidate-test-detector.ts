import * as path from 'path';
import { TestImplication } from '../schemas/change-analysis.schema';

export class CandidateTestDetector {
  static detectCandidateTests(
    changedFile: string,
    existingTests?: string[]
  ): TestImplication {
    const normalized = changedFile.replace(/\\/g, '/');
    const ext = path.extname(normalized);
    const basenameWithoutExt = path.basename(normalized, ext);
    const dirname = path.dirname(normalized);

    // Skip if the changed file itself is already a test
    if (
      normalized.includes('.test.') ||
      normalized.includes('.spec.') ||
      normalized.includes('/__tests__/')
    ) {
      return {
        changedFile,
        candidateTests: [changedFile],
        recommendation: 'Test file modified directly; verify test assertions and coverage.',
      };
    }

    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const testSuffixes = ['.test', '.spec'];
    const candidates: Set<string> = new Set();

    // 1. Co-located tests (e.g. src/payment/service.test.ts)
    for (const suffix of testSuffixes) {
      for (const e of extensions) {
        candidates.add(`${dirname}/${basenameWithoutExt}${suffix}${e}`);
      }
    }

    // 2. Mirror under test/ or tests/ (e.g. test/payment/service.test.ts)
    const relativeToSrc = dirname.startsWith('src/') ? dirname.slice(4) : dirname;
    for (const suffix of testSuffixes) {
      for (const e of extensions) {
        candidates.add(`test/${relativeToSrc}/${basenameWithoutExt}${suffix}${e}`);
        candidates.add(`tests/${relativeToSrc}/${basenameWithoutExt}${suffix}${e}`);
        candidates.add(`test/${basenameWithoutExt}${suffix}${e}`);
        candidates.add(`tests/${basenameWithoutExt}${suffix}${e}`);
      }
    }

    let finalCandidates: string[] = [];

    if (existingTests && existingTests.length > 0) {
      const existingSet = new Set(existingTests.map((t) => t.replace(/\\/g, '/')));
      finalCandidates = Array.from(candidates).filter((c) => existingSet.has(c));
    } else {
      // Pick top common conventions if no manifest is provided
      finalCandidates = [
        `${dirname}/${basenameWithoutExt}.test${ext || '.ts'}`,
        `${dirname}/${basenameWithoutExt}.spec${ext || '.ts'}`,
        `test/${relativeToSrc}/${basenameWithoutExt}.test${ext || '.ts'}`,
      ];
    }

    return {
      changedFile,
      candidateTests: Array.from(new Set(finalCandidates)),
      recommendation:
        finalCandidates.length > 0
          ? `Candidate regression tests identified for ${path.basename(changedFile)}.`
          : 'No standard candidate tests found; consider authoring regression test cases.',
    };
  }
}

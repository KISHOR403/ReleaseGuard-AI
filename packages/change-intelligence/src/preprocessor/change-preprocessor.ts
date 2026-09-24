import { ChangeAnalysisInput, AffectedApi, RiskIndicator, TestImplication } from '../schemas/change-analysis.schema';
import { FileAnalyzer, FileClassification } from '../analyzers/file-analyzer';
import { DiffAnalyzer, DiffStatistics } from '../analyzers/diff-analyzer';
import { ApiAnalyzer } from '../analyzers/api-analyzer';
import { DependencyAnalyzer } from '../analyzers/dependency-analyzer';
import { CandidateTestDetector } from '../analyzers/candidate-test-detector';

export interface PreprocessedFile {
  path: string;
  category: string;
  domainHint: string;
  additions: number;
  deletions: number;
  status: string;
  isTest: boolean;
  isDatabase: boolean;
  isSecurityRelated: boolean;
  patchSummary: string;
  isTruncated: boolean;
}

export interface DeterministicAnalysisSummary {
  totalFiles: number;
  totalAdditions: number;
  totalDeletions: number;
  fileClassifications: FileClassification[];
  diffStats: DiffStatistics;
  detectedApis: AffectedApi[];
  deterministicRiskIndicators: RiskIndicator[];
  testImplications: TestImplication[];
  unknowns: string[];
  preprocessedFiles: PreprocessedFile[];
}

export class ChangePreprocessor {
  private static readonly MAX_PATCH_CHARS_PER_FILE = 12000;

  static preprocess(input: ChangeAnalysisInput): DeterministicAnalysisSummary {
    const fileClassifications: FileClassification[] = [];
    const detectedApis: AffectedApi[] = [];
    const deterministicRiskIndicators: RiskIndicator[] = [];
    const testImplications: TestImplication[] = [];
    const unknowns: string[] = [];
    const preprocessedFiles: PreprocessedFile[] = [];

    let totalAdditions = 0;
    let totalDeletions = 0;
    const aggregatedAddedFunctions: string[] = [];
    const aggregatedRemovedFunctions: string[] = [];
    const aggregatedImports: string[] = [];
    const aggregatedExports: string[] = [];
    const aggregatedEnvRefs: string[] = [];
    const aggregatedDeps: string[] = [];

    for (const file of input.changedFiles) {
      // 1. File classification
      const classification = FileAnalyzer.analyze(file.path);
      fileClassifications.push(classification);

      // 2. Diff analysis
      const diffStat = DiffAnalyzer.analyze(file.patch);
      const additions = file.additions || diffStat.additions;
      const deletions = file.deletions || diffStat.deletions;
      totalAdditions += additions;
      totalDeletions += deletions;

      aggregatedAddedFunctions.push(...diffStat.addedFunctions);
      aggregatedRemovedFunctions.push(...diffStat.removedFunctions);
      aggregatedImports.push(...diffStat.changedImports);
      aggregatedExports.push(...diffStat.changedExports);
      aggregatedEnvRefs.push(...diffStat.changedEnvReferences);
      aggregatedDeps.push(...diffStat.changedDependencies);

      // 3. API detection
      const apiResult = ApiAnalyzer.analyzeFile(file.path, file.patch);
      detectedApis.push(...apiResult.detectedApis);
      unknowns.push(...apiResult.unknowns);

      if (apiResult.detectedApis.length > 0) {
        deterministicRiskIndicators.push({
          type: 'API_CHANGE',
          description: `API route modifications detected in ${file.path}.`,
          evidence: [file.path, ...apiResult.detectedApis.map((a) => `${a.method} ${a.path}`)],
          confidence: 0.94,
        });
      }

      // 4. Dependency analysis
      const depResult = DependencyAnalyzer.analyze(file.path, file.patch);
      deterministicRiskIndicators.push(...depResult.riskIndicators);

      // 5. Database detection risk
      if (classification.isDatabase) {
        deterministicRiskIndicators.push({
          type: 'DATABASE_CHANGE',
          description: `Database schema or migration change detected in ${file.path}.`,
          evidence: [file.path],
          confidence: 0.95,
        });
      }

      // 6. Security detection risk
      if (classification.isSecurityRelated) {
        deterministicRiskIndicators.push({
          type: 'SECURITY_SENSITIVE_CHANGE',
          description: `Security or authentication-related component modified in ${file.path}.`,
          evidence: [file.path],
          confidence: 0.9,
        });
      }

      // 7. Candidate test detection
      if (!classification.isTest) {
        const testImp = CandidateTestDetector.detectCandidateTests(file.path, input.existingTests);
        testImplications.push(testImp);
      }

      // 8. Truncation management for LLM evidence
      let patchSummary = file.patch || '';
      let isTruncated = false;

      if (patchSummary.length > this.MAX_PATCH_CHARS_PER_FILE) {
        isTruncated = true;
        patchSummary = patchSummary.slice(0, this.MAX_PATCH_CHARS_PER_FILE) + '\n... [Diff truncated to avoid LLM context overflow]';
        unknowns.push(`Diff for ${file.path} was truncated due to large size (${file.patch?.length} characters).`);
      }

      preprocessedFiles.push({
        path: file.path,
        category: classification.category,
        domainHint: classification.domainHint,
        additions,
        deletions,
        status: file.status,
        isTest: classification.isTest,
        isDatabase: classification.isDatabase,
        isSecurityRelated: classification.isSecurityRelated,
        patchSummary,
        isTruncated,
      });
    }

    const diffStats: DiffStatistics = {
      additions: totalAdditions,
      deletions: totalDeletions,
      changedLines: totalAdditions + totalDeletions,
      addedFunctions: Array.from(new Set(aggregatedAddedFunctions)),
      removedFunctions: Array.from(new Set(aggregatedRemovedFunctions)),
      changedImports: Array.from(new Set(aggregatedImports)),
      changedExports: Array.from(new Set(aggregatedExports)),
      changedEnvReferences: Array.from(new Set(aggregatedEnvRefs)),
      changedDependencies: Array.from(new Set(aggregatedDeps)),
    };

    return {
      totalFiles: input.changedFiles.length,
      totalAdditions,
      totalDeletions,
      fileClassifications,
      diffStats,
      detectedApis,
      deterministicRiskIndicators,
      testImplications,
      unknowns,
      preprocessedFiles,
    };
  }
}

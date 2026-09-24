import { LLMClient, TokenUsage } from '@releaseguard/ai';
import {
  ChangeAnalysisInput,
  ChangeAnalysisResult,
  ChangeAnalysisResultSchema,
  RiskIndicator,
  AffectedApi,
  TestImplication,
} from '../schemas/change-analysis.schema';
import { ChangePreprocessor, DeterministicAnalysisSummary } from '../preprocessor/change-preprocessor';

export interface AgentExecutionOutput {
  result: ChangeAnalysisResult;
  deterministicSummary: DeterministicAnalysisSummary;
  provider: string;
  model: string;
  tokensUsed?: TokenUsage;
}

export class ChangeIntelligenceAgent {
  private readonly llmClient: LLMClient;

  constructor(llmClient?: LLMClient) {
    this.llmClient = llmClient || new LLMClient();
  }

  async analyzeChange(input: ChangeAnalysisInput): Promise<AgentExecutionOutput> {
    // 1. Run deterministic preprocessing
    const summary = ChangePreprocessor.preprocess(input);

    // 2. Prepare System Prompt
    const systemPrompt = `You are the Change Intelligence Agent for ReleaseGuard AI.
Your role is to perform objective, evidence-based quality engineering analysis on code changes.

CRITICAL RULES:
1. Return ONLY a single valid JSON object strictly matching the required schema.
2. Ground all conclusions in the provided deterministic facts and diff. DO NOT invent facts, files, or endpoints.
3. Every risk indicator MUST contain an 'evidence' array citing specific file paths, symbols, or API signatures.
4. Explanations must be concrete and technical. NEVER say "AI thinks this is risky". State facts like "API endpoint signature modified in payment controller."
5. Categorize changeType into one of: FEATURE, BUG_FIX, REFACTOR, CONFIGURATION, DEPENDENCY, DATABASE, API, SECURITY, TEST, DOCUMENTATION, UNKNOWN.
6. Categorize impact for each changedArea as: LOW, MEDIUM, HIGH, CRITICAL, or UNKNOWN.
7. Any ambiguous or partially understood aspects must be placed in the 'unknowns' list.`;

    // 3. Prepare User Prompt
    const userPrompt = `Perform a change intelligence analysis on the following pull request:

REPOSITORY CONTEXT:
- Repository: ${input.repository}
- Base Branch: ${input.baseBranch}
- Target Branch: ${input.targetBranch}
${input.commitSha ? `- Commit SHA: ${input.commitSha}` : ''}
${input.pullRequestNumber ? `- PR Number: #${input.pullRequestNumber}` : ''}

DETERMINISTIC EXTRACTIONS:
- Total Files Changed: ${summary.totalFiles} (+${summary.totalAdditions} / -${summary.totalDeletions})
- Added Functions: ${summary.diffStats.addedFunctions.join(', ') || 'None'}
- Removed Functions: ${summary.diffStats.removedFunctions.join(', ') || 'None'}
- Changed Dependencies: ${summary.diffStats.changedDependencies.join(', ') || 'None'}
- Changed Environment References: ${summary.diffStats.changedEnvReferences.join(', ') || 'None'}

DETECTED APIS:
${summary.detectedApis.length > 0 ? JSON.stringify(summary.detectedApis, null, 2) : 'None detected'}

DETERMINISTIC RISK INDICATORS:
${summary.deterministicRiskIndicators.length > 0 ? JSON.stringify(summary.deterministicRiskIndicators, null, 2) : 'None'}

CANDIDATE TESTS IDENTIFIED:
${summary.testImplications.length > 0 ? JSON.stringify(summary.testImplications, null, 2) : 'None'}

CHANGED FILES & DIFF SNIPPETS:
${summary.preprocessedFiles
  .map(
    (f) => `--- File: ${f.path} (${f.status}, +${f.additions}/-${f.deletions}, category: ${f.category}, domain: ${f.domainHint})
${f.patchSummary || '(No patch content provided)'}`
  )
  .join('\n\n')}

Analyze these changes and output the structured JSON:
{
  "summary": string,
  "changeType": "FEATURE" | "BUG_FIX" | "REFACTOR" | "CONFIGURATION" | "DEPENDENCY" | "DATABASE" | "API" | "SECURITY" | "TEST" | "DOCUMENTATION" | "UNKNOWN",
  "changedAreas": [{ "name": string, "type": string, "impact": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN" }],
  "affectedComponents": [string],
  "affectedApis": [{ "method": string, "path": string, "sourceFile": string, "confidence": number }],
  "riskIndicators": [{ "type": string, "description": string, "evidence": [string], "confidence": number }],
  "testImplications": [{ "changedFile": string, "candidateTests": [string], "recommendation": string }],
  "confidence": number,
  "unknowns": [string]
}`;

    // 4. Execute with structured schema validation and auto-correction
    const { data: llmResult, response } = await this.llmClient.executeStructuredPrompt<ChangeAnalysisResult>(
      {
        systemPrompt,
        userPrompt,
        temperature: 0.1, // low temperature for deterministic consistency
      },
      (data: unknown) => {
        const parseResult = ChangeAnalysisResultSchema.safeParse(data);
        if (parseResult.success) {
          return { success: true, data: parseResult.data };
        }
        const errorMessages = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return { success: false, error: errorMessages };
      }
    );

    // 5. Merge deterministic facts to guarantee zero loss of hard evidence
    const mergedResult = this.mergeDeterministicFacts(llmResult, summary);

    return {
      result: mergedResult,
      deterministicSummary: summary,
      provider: response.provider,
      model: response.model,
      tokensUsed: response.tokensUsed,
    };
  }

  private mergeDeterministicFacts(
    llmResult: ChangeAnalysisResult,
    summary: DeterministicAnalysisSummary
  ): ChangeAnalysisResult {
    // 1. Ensure all detected APIs are present
    const apiMap = new Map<string, AffectedApi>();
    for (const api of summary.detectedApis) {
      apiMap.set(`${api.method}:${api.path}`, api);
    }
    for (const api of llmResult.affectedApis) {
      apiMap.set(`${api.method}:${api.path}`, api);
    }

    // 2. Ensure deterministic risk indicators are preserved
    const riskMap = new Map<string, RiskIndicator>();
    for (const risk of summary.deterministicRiskIndicators) {
      riskMap.set(risk.description, risk);
    }
    for (const risk of llmResult.riskIndicators) {
      riskMap.set(risk.description, risk);
    }

    // 3. Ensure test implications exist for all non-test files
    const testMap = new Map<string, TestImplication>();
    for (const test of summary.testImplications) {
      testMap.set(test.changedFile, test);
    }
    for (const test of llmResult.testImplications) {
      testMap.set(test.changedFile, test);
    }

    // 4. Combine unknowns
    const allUnknowns = Array.from(new Set([...summary.unknowns, ...llmResult.unknowns]));

    return {
      ...llmResult,
      affectedApis: Array.from(apiMap.values()),
      riskIndicators: Array.from(riskMap.values()),
      testImplications: Array.from(testMap.values()),
      unknowns: allUnknowns,
    };
  }
}

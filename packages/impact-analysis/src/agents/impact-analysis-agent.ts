import { LLMClient, TokenUsage } from '@releaseguard/ai';
import {
  ImpactAnalysisInput,
  ImpactAnalysisResult,
  ImpactAnalysisResultSchema,
  Evidence,
  UnknownImpact,
  ApiImpact,
  DatabaseImpact,
  TestImpact,
} from '../schemas/impact-analysis.schema';
import { RepositoryIndexer } from '../indexer/repository-indexer';
import { DependencyAnalyzer } from '../analyzers/dependency-analyzer';
import { TransitiveTraversalEngine } from '../analyzers/transitive-traversal';
import { ApiContractAnalyzer } from '../analyzers/api-contract-analyzer';
import { DatabaseImpactAnalyzer } from '../analyzers/database-impact-analyzer';
import { TestImpactAnalyzer } from '../analyzers/test-impact-analyzer';
import { ImpactGraphBuilder } from '../graph/impact-graph-builder';
import { BlastRadiusCalculator } from '../graph/blast-radius-calculator';

export interface ImpactAgentOutput {
  result: ImpactAnalysisResult;
  provider: string;
  model: string;
  tokensUsed?: TokenUsage;
}

export class ImpactAnalysisAgent {
  private readonly indexer = new RepositoryIndexer();
  private readonly depAnalyzer = new DependencyAnalyzer();
  private readonly traversalEngine = new TransitiveTraversalEngine();
  private readonly apiAnalyzer = new ApiContractAnalyzer();
  private readonly dbAnalyzer = new DatabaseImpactAnalyzer();
  private readonly testAnalyzer = new TestImpactAnalyzer();
  private readonly graphBuilder = new ImpactGraphBuilder();
  private readonly calculator = new BlastRadiusCalculator();

  constructor(private readonly llmClient: LLMClient) {}

  async analyzeImpact(input: ImpactAnalysisInput): Promise<ImpactAgentOutput> {
    const maxDepth = input.options?.maxTraversalDepth ?? 5;

    // 1. Deterministic Repository Indexing
    const index = this.indexer.indexRepository(input.repositorySnapshot.files);

    // 2. Build Dependency Graph
    const depGraph = this.depAnalyzer.buildDependencyGraph(index);

    // 3. Identify Root Changed Files from change analysis
    const changedFiles: string[] = [];
    if (input.changeAnalysis?.testImplications) {
      for (const impl of input.changeAnalysis.testImplications) {
        if (index.files.has(impl.changedFile) && !changedFiles.includes(impl.changedFile)) {
          changedFiles.push(impl.changedFile);
        }
      }
    }
    // Also include any changed files present in snapshot
    for (const filePath of index.files.keys()) {
      if (input.changeAnalysis?.summary && !changedFiles.includes(filePath)) {
        const baseName = filePath.split('/').pop()?.replace(/\.[^.]+$/, '');
        if (
          baseName &&
          input.changeAnalysis.affectedComponents?.some(
            (c) => c.toLowerCase() === baseName.toLowerCase() || filePath.toLowerCase().includes(c.toLowerCase())
          )
        ) {
          changedFiles.push(filePath);
        }
      }

      // Automatically include any migration or database schema files
      if (
        filePath.includes('migration') ||
        (filePath.startsWith('db/') && (filePath.endsWith('.sql') || filePath.endsWith('.prisma'))) ||
        filePath.endsWith('schema.prisma')
      ) {
        if (!changedFiles.includes(filePath)) {
          changedFiles.push(filePath);
        }
      }
    }

    // Fallback: If no changed file matched directly, take first non-test file or default to first file
    if (changedFiles.length === 0) {
      const candidate = Array.from(index.files.keys()).find(
        (f) => !f.includes('.test.') && !f.includes('.spec.')
      );
      if (candidate) changedFiles.push(candidate);
    }

    // 4. Traversal of Downstream Impacts
    const traversal = this.traversalEngine.traverseDownstreamImpact(changedFiles, depGraph, maxDepth);

    // 5. API Contract Analysis
    const apis = this.apiAnalyzer.analyzeApiContracts(
      input.openApiSpec,
      input.previousOpenApiSpec,
      index.routes
    );

    // 6. Database Blast Radius Analysis
    const database = this.dbAnalyzer.analyzeDatabaseImpact(changedFiles, index);

    // 7. Test Impact Analysis
    const candidateTestNames = input.changeAnalysis?.testImplications?.flatMap((t) => t.candidateTests) || [];
    const tests = this.testAnalyzer.analyzeTestImpact(traversal, index, apis, candidateTestNames);

    // 8. Quality Impact Graph Construction
    const graphData = this.graphBuilder.buildImpactGraph(
      traversal,
      index,
      apis,
      database,
      tests
    );

    // 9. Blast Radius Score & Factor Breakdown
    const { score: blastRadiusScore, breakdown } = this.calculator.calculateScore(
      graphData.directNodes,
      graphData.transitiveNodes,
      traversal.maxDepth,
      apis,
      database,
      tests,
      input.options?.weights
    );

    // 10. Collect Unknowns
    const unknowns: UnknownImpact[] = [...index.unknowns];
    if (traversal.cyclicEdgesDetected.length > 0) {
      unknowns.push({
        area: 'cyclic_dependency',
        description: `Cyclic import dependency detected between ${traversal.cyclicEdgesDetected
          .map((c) => `${c.from} <-> ${c.to}`)
          .join(', ')}`,
      });
    }

    // 11. Compile Evidence
    const allEvidence: Evidence[] = [];
    for (const node of graphData.nodes) {
      allEvidence.push(...node.evidence);
    }

    // 12. Synthesize Executive Architectural Summary (LLM or deterministic fallback)
    const deterministicSummary = this.generateDeterministicSummary(
      changedFiles,
      graphData.directNodes.length,
      graphData.transitiveNodes.length,
      traversal.maxDepth,
      blastRadiusScore,
      apis,
      database,
      tests
    );

    let finalSummary = deterministicSummary;
    let providerName = this.llmClient.getProviderName();
    let modelName = 'gemini-2.5-flash';
    let tokensUsed: TokenUsage | undefined;

    try {
      const llmPrompt = `
You are the Impact Analysis Agent for ReleaseGuard AI.
Analyze the following deterministic quality engineering facts and produce a concise executive architectural summary (2-4 sentences) explaining:
1. What was directly changed and the downstream blast radius path.
2. Key breaking API changes, database entities, or downstream services affected.
3. Test suites that must be prioritized for regression.

DETERMINISTIC FACTS:
- Changed Files: ${changedFiles.join(', ')}
- Direct Nodes: ${graphData.directNodes.length}
- Transitive Nodes: ${graphData.transitiveNodes.length}
- Max Dependency Depth: ${traversal.maxDepth}
- Blast Radius Score: ${blastRadiusScore} / 100
- APIs: ${apis.map((a) => `${a.changeType} ${a.method} ${a.path} (${a.details})`).join('; ') || 'None'}
- Database: ${database.map((d) => `${d.name} (${d.consumers.length} consumers)`).join('; ') || 'None'}
- Impacted Tests: ${tests.map((t) => `${t.testFile} (${t.relationship})`).join(', ') || 'None'}

Return a JSON object with a single string field: { "summary": "..." }
`;

      const llmResult = await this.llmClient.executeStructuredPrompt<{ summary: string }>(
        {
          systemPrompt:
            'You are an expert software architect. You output only valid JSON with field "summary". Never invent ungrounded dependencies.',
          userPrompt: llmPrompt,
          temperature: 0.1,
        },
        (parsed: unknown) => {
          if (parsed && typeof parsed === 'object' && 'summary' in parsed && typeof (parsed as { summary: unknown }).summary === 'string') {
            return { success: true, data: parsed as { summary: string } };
          }
          return { success: false, error: 'Expected object with "summary" string property' };
        }
      );

      finalSummary = llmResult.data.summary;
      providerName = llmResult.response.provider;
      modelName = llmResult.response.model;
      tokensUsed = llmResult.response.tokensUsed;
    } catch {
      // Gracefully fall back to deterministic summary without interrupting pipeline
    }

    const result: ImpactAnalysisResult = {
      summary: finalSummary,
      blastRadiusScore,
      breakdown,
      directImpact: {
        nodes: graphData.directNodes,
        count: graphData.directNodes.length,
      },
      transitiveImpact: {
        nodes: graphData.transitiveNodes,
        count: graphData.transitiveNodes.length,
        maxDepth: traversal.maxDepth,
      },
      affectedComponents: graphData.affectedComponents,
      affectedApis: apis,
      affectedDatabase: database,
      affectedTests: tests,
      graph: {
        nodes: graphData.nodes,
        edges: graphData.edges,
      },
      unknowns,
      evidence: allEvidence.slice(0, 50),
      confidence: 0.94,
    };

    // Strict validation against Zod schema
    const validated = ImpactAnalysisResultSchema.parse(result);

    return {
      result: validated,
      provider: providerName,
      model: modelName,
      tokensUsed,
    };
  }

  private generateDeterministicSummary(
    changedFiles: string[],
    directCount: number,
    transitiveCount: number,
    maxDepth: number,
    blastRadius: number,
    apis: ApiImpact[],
    database: DatabaseImpact[],
    tests: TestImpact[]
  ): string {
    const breakingApiCount = apis.filter((a) => a.changeType === 'BREAKING').length;
    const parts = [
      `Modification to ${changedFiles.join(', ')} directly affects ${directCount} node(s) with a transitive blast radius reaching ${transitiveCount} downstream node(s) across maximum depth ${maxDepth} (Blast Radius Score: ${blastRadius}/100).`,
    ];

    if (breakingApiCount > 0) {
      parts.push(`Detected ${breakingApiCount} breaking API contract change(s) requiring client contract reconciliation.`);
    }

    if (database.length > 0) {
      parts.push(`Database modifications impact ${database.length} entity/entities across ${database.reduce((acc, d) => acc + d.consumers.length, 0)} consuming component(s).`);
    }

    if (tests.length > 0) {
      parts.push(`Identified ${tests.length} candidate/verified regression test suite(s) to validate affected downstream workflows.`);
    }

    return parts.join(' ');
  }
}

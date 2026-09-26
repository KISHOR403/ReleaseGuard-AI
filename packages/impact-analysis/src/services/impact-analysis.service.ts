import { LLMClient } from '@releaseguard/ai';
import {
  ImpactAnalysisInputSchema,
} from '../schemas/impact-analysis.schema';
import { ImpactAnalysisAgent, ImpactAgentOutput } from '../agents/impact-analysis-agent';

export class ImpactAnalysisService {
  private readonly agent: ImpactAnalysisAgent;

  constructor(llmClient?: LLMClient) {
    this.agent = new ImpactAnalysisAgent(llmClient || new LLMClient());
  }

  async analyzeImpact(rawInput: unknown): Promise<ImpactAgentOutput> {
    const input = ImpactAnalysisInputSchema.parse(rawInput);
    return this.agent.analyzeImpact(input);
  }
}

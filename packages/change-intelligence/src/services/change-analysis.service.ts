import { ChangeIntelligenceAgent, AgentExecutionOutput } from '../agents/change-intelligence-agent';
import { ChangeAnalysisInputSchema } from '../schemas/change-analysis.schema';
import { LLMClient } from '@releaseguard/ai';

export class ChangeAnalysisService {
  private readonly agent: ChangeIntelligenceAgent;

  constructor(agent?: ChangeIntelligenceAgent) {
    this.agent = agent || new ChangeIntelligenceAgent(new LLMClient());
  }

  async runAnalysis(rawInput: unknown): Promise<AgentExecutionOutput> {
    const input = ChangeAnalysisInputSchema.parse(rawInput);
    return this.agent.analyzeChange(input);
  }
}

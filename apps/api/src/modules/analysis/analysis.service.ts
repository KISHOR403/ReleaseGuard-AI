import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { AgentRunRepository } from '../database/agent-run.repository';
import {
  ChangeIntelligenceAgent,
  ChangeAnalysisInputSchema,
  ChangeAnalysisResult,
} from '@releaseguard/change-intelligence';
import {
  ImpactAnalysisAgent,
  ImpactAnalysisInputSchema,
  ImpactAnalysisResult,
} from '@releaseguard/impact-analysis';
import { LLMClient } from '@releaseguard/ai';

export interface AnalysisResponse {
  analysisId: string;
  status: 'COMPLETED' | 'FAILED';
  result?: ChangeAnalysisResult;
  error?: string;
}

export interface ImpactResponse {
  analysisId: string;
  status: 'COMPLETED' | 'FAILED';
  result?: ImpactAnalysisResult;
  error?: string;
}

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);
  private readonly changeAgent: ChangeIntelligenceAgent;
  private readonly impactAgent: ImpactAnalysisAgent;

  constructor(private readonly agentRunRepo: AgentRunRepository) {
    const llmClient = new LLMClient();
    this.changeAgent = new ChangeIntelligenceAgent(llmClient);
    this.impactAgent = new ImpactAnalysisAgent(llmClient);
  }

  async analyzeChange(rawInput: unknown): Promise<AnalysisResponse> {
    const parseResult = ChangeAnalysisInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const issues = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Invalid ChangeAnalysisInput payload: ${issues}`,
        },
        HttpStatus.BAD_REQUEST
      );
    }

    const input = parseResult.data;
    const analysisId = await this.agentRunRepo.createRun(input);

    try {
      this.logger.log(`Executing Change Intelligence Agent for run ${analysisId} (${input.repository})`);
      const output = await this.changeAgent.analyzeChange(input);

      await this.agentRunRepo.completeRun(analysisId, {
        result: output.result,
        provider: output.provider,
        model: output.model,
        tokensUsed: output.tokensUsed,
      });

      this.logger.log(`Change Intelligence Agent completed successfully for run ${analysisId}`);
      return {
        analysisId,
        status: 'COMPLETED',
        result: output.result,
      };
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : String(error);
      const sanitizedMessage = rawMessage.replace(/([a-zA-Z0-9_-]{20,})/g, '[REDACTED]');

      this.logger.error(`Change Intelligence Agent failed for run ${analysisId}: ${sanitizedMessage}`);
      await this.agentRunRepo.failRun(analysisId, sanitizedMessage);

      return {
        analysisId,
        status: 'FAILED',
        error: sanitizedMessage,
      };
    }
  }

  async analyzeImpact(rawInput: unknown): Promise<ImpactResponse> {
    const parseResult = ImpactAnalysisInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const issues = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Invalid ImpactAnalysisInput payload: ${issues}`,
        },
        HttpStatus.BAD_REQUEST
      );
    }

    const input = parseResult.data;
    const repoName = input.repository?.name || 'snapshot-repo';
    const analysisId = await this.agentRunRepo.createImpactRun(input, repoName);

    try {
      this.logger.log(`Executing Impact Analysis Agent for run ${analysisId} (${repoName})`);
      const output = await this.impactAgent.analyzeImpact(input);

      await this.agentRunRepo.completeRun(analysisId, {
        result: output.result,
        provider: output.provider,
        model: output.model,
        tokensUsed: output.tokensUsed,
      });

      this.logger.log(`Impact Analysis Agent completed successfully for run ${analysisId}`);
      return {
        analysisId,
        status: 'COMPLETED',
        result: output.result,
      };
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : String(error);
      const sanitizedMessage = rawMessage.replace(/([a-zA-Z0-9_-]{20,})/g, '[REDACTED]');

      this.logger.error(`Impact Analysis Agent failed for run ${analysisId}: ${sanitizedMessage}`);
      await this.agentRunRepo.failRun(analysisId, sanitizedMessage);

      return {
        analysisId,
        status: 'FAILED',
        error: sanitizedMessage,
      };
    }
  }

  async getAnalysisById(id: string) {
    const record = await this.agentRunRepo.getRunById(id);
    if (!record) {
      throw new HttpException(`Analysis run "${id}" not found`, HttpStatus.NOT_FOUND);
    }
    return {
      analysisId: record.id,
      status: record.status,
      type: record.type,
      repository: record.repository,
      baseBranch: record.baseBranch,
      targetBranch: record.targetBranch,
      provider: record.provider,
      model: record.model,
      result: record.result,
      error: record.errorMessage,
      startedAt: record.startedAt,
      completedAt: record.completedAt,
    };
  }
}

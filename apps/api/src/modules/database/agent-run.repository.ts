import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { ChangeAnalysisInput, ChangeAnalysisResult } from '@releaseguard/change-intelligence';

export interface AgentRunRecord {
  id: string;
  type: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  repository: string;
  baseBranch?: string;
  targetBranch?: string;
  commitSha?: string;
  pullRequestNumber?: number;
  provider?: string;
  model?: string;
  tokenUsage?: unknown;
  inputData: ChangeAnalysisInput;
  result?: ChangeAnalysisResult;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

@Injectable()
export class AgentRunRepository {
  private readonly logger = new Logger(AgentRunRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async onModuleInit(): Promise<void> {
    await this.initializeTable();
  }

  private async initializeTable(): Promise<void> {
    const pool = this.databaseService.getPool();
    if (!pool) return;

    const query = `
      CREATE TABLE IF NOT EXISTS agent_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        repository VARCHAR(255) NOT NULL,
        base_branch VARCHAR(255),
        target_branch VARCHAR(255),
        commit_sha VARCHAR(100),
        pull_request_number INT,
        provider VARCHAR(50),
        model VARCHAR(100),
        token_usage JSONB,
        input_data JSONB NOT NULL,
        result JSONB,
        error_message TEXT,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_agent_runs_repository ON agent_runs(repository);
      CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);
      CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at ON agent_runs(created_at DESC);
    `;

    try {
      await pool.query(query);
      this.logger.log('Database table "agent_runs" initialized successfully');
    } catch (err) {
      this.logger.warn(`Failed to initialize "agent_runs" table: ${(err as Error).message}`);
    }
  }

  async createRun(input: ChangeAnalysisInput): Promise<string> {
    const pool = this.databaseService.getPool();
    if (!pool || !this.databaseService.isDatabaseConnected()) {
      // In-memory fallback UUID if DB is offline
      const fallbackId = `run-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      return fallbackId;
    }

    const query = `
      INSERT INTO agent_runs (
        type, status, repository, base_branch, target_branch, commit_sha, pull_request_number, input_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id;
    `;

    const values = [
      'CHANGE_ANALYSIS',
      'RUNNING',
      input.repository,
      input.baseBranch || 'main',
      input.targetBranch || 'current',
      input.commitSha || null,
      input.pullRequestNumber || null,
      JSON.stringify(input),
    ];

    const res = await pool.query(query, values);
    return res.rows[0].id;
  }

  async completeRun(
    id: string,
    params: {
      result: ChangeAnalysisResult;
      provider: string;
      model: string;
      tokensUsed?: unknown;
    }
  ): Promise<void> {
    const pool = this.databaseService.getPool();
    if (!pool || !this.databaseService.isDatabaseConnected()) return;

    const query = `
      UPDATE agent_runs
      SET status = 'COMPLETED',
          result = $1,
          provider = $2,
          model = $3,
          token_usage = $4,
          completed_at = NOW()
      WHERE id = $5;
    `;

    await pool.query(query, [
      JSON.stringify(params.result),
      params.provider,
      params.model,
      params.tokensUsed ? JSON.stringify(params.tokensUsed) : null,
      id,
    ]);
  }

  async failRun(id: string, errorMessage: string, provider?: string): Promise<void> {
    const pool = this.databaseService.getPool();
    if (!pool || !this.databaseService.isDatabaseConnected()) return;

    const query = `
      UPDATE agent_runs
      SET status = 'FAILED',
          error_message = $1,
          provider = $2,
          completed_at = NOW()
      WHERE id = $3;
    `;

    await pool.query(query, [errorMessage, provider || null, id]);
  }

  async getRunById(id: string): Promise<AgentRunRecord | null> {
    const pool = this.databaseService.getPool();
    if (!pool || !this.databaseService.isDatabaseConnected()) return null;

    const query = `SELECT * FROM agent_runs WHERE id = $1;`;
    const res = await pool.query(query, [id]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      type: row.type,
      status: row.status,
      repository: row.repository,
      baseBranch: row.base_branch,
      targetBranch: row.target_branch,
      commitSha: row.commit_sha,
      pullRequestNumber: row.pull_request_number,
      provider: row.provider,
      model: row.model,
      tokenUsage: row.token_usage,
      inputData: row.input_data,
      result: row.result,
      errorMessage: row.error_message,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
    };
  }
}

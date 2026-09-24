import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;
  private connected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const host = this.configService.get<string>('DATABASE_HOST', 'localhost');
    const port = Number(this.configService.get<number>('DATABASE_PORT', 5432));
    const database = this.configService.get<string>('DATABASE_NAME', 'releaseguard');
    const user = this.configService.get<string>('DATABASE_USER', 'releaseguard');
    const password = this.configService.get<string>('DATABASE_PASSWORD', 'change_me');

    this.pool = new Pool({
      host,
      port,
      database,
      user,
      password,
      connectionTimeoutMillis: 5000,
    });

    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1 AS connected');
      client.release();
      this.connected = true;
      this.logger.log(`Successfully connected to PostgreSQL at ${host}:${port}/${database}`);
    } catch (error) {
      this.connected = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`PostgreSQL connection check failed: ${errorMessage}`);
      this.logger.warn('Ensure PostgreSQL container is running via: docker compose up -d');
    }
  }

  isDatabaseConnected(): boolean {
    return this.connected;
  }

  getPool(): Pool | null {
    return this.pool;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('PostgreSQL connection pool closed');
    }
  }
}

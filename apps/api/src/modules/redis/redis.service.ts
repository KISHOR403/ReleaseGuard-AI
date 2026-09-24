import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private connected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = Number(this.configService.get<number>('REDIS_PORT', 6379));

    this.client = new Redis({
      host,
      port,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    });

    this.client.on('error', (err) => {
      this.connected = false;
      this.logger.warn(`Redis connection error: ${err.message}`);
    });

    try {
      await this.client.connect();
      const pingResult = await this.client.ping();
      if (pingResult === 'PONG') {
        this.connected = true;
        this.logger.log(`Successfully connected to Redis at ${host}:${port}`);
      }
    } catch (error) {
      this.connected = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Redis connectivity check failed: ${errorMessage}`);
      this.logger.warn('Ensure Redis container is running via: docker compose up -d');
    }
  }

  isRedisConnected(): boolean {
    return this.connected;
  }

  getClient(): Redis | null {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      this.client.disconnect();
      this.logger.log('Redis client disconnected');
    }
  }
}

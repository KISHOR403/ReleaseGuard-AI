import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { AgentRunRepository } from './agent-run.repository';

@Global()
@Module({
  providers: [DatabaseService, AgentRunRepository],
  exports: [DatabaseService, AgentRunRepository],
})
export class DatabaseModule {}

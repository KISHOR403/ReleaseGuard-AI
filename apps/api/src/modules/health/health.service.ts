import { Injectable } from '@nestjs/common';
import { HealthStatus } from '@releaseguard/shared';

@Injectable()
export class HealthService {
  getHealth(): HealthStatus {
    return {
      status: 'ok',
      service: 'releaseguard-api',
    };
  }
}

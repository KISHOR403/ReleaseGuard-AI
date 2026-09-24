import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../apps/api/src/app.module';

describe('Analysis API Integration Tests (POST & GET /analysis/change)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Enforce mock provider to ensure no real LLM calls are made
    process.env.AI_PROVIDER = 'mock';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  let createdAnalysisId: string;

  it('POST /analysis/change - should execute change analysis and return structured result', async () => {
    const payload = {
      repository: 'demo-ecommerce',
      baseBranch: 'main',
      targetBranch: 'feature/payment-update',
      changedFiles: [
        {
          path: 'src/payment/controller.ts',
          status: 'modified',
          additions: 15,
          deletions: 3,
          patch: `
@Controller('/api/v1/payments')
export class PaymentController {
  @Post('charge')
  createCharge() {}
}
          `,
        },
        {
          path: 'src/payment/service.ts',
          status: 'modified',
          additions: 25,
          deletions: 5,
          patch: `
export class PaymentService {
  async processCharge(amount: number) {
    return { success: true };
  }
}
          `,
        },
      ],
      existingTests: ['src/payment/service.test.ts'],
    };

    const response = await request(app.getHttpServer())
      .post('/analysis/change')
      .send(payload)
      .expect(201);

    expect(response.body).toHaveProperty('analysisId');
    expect(response.body.status).toBe('COMPLETED');
    expect(response.body.result).toBeDefined();
    expect(response.body.result.summary).toBeDefined();
    expect(response.body.result.changeType).toBeDefined();
    expect(response.body.result.confidence).toBeGreaterThan(0);
    expect(Array.isArray(response.body.result.riskIndicators)).toBe(true);

    createdAnalysisId = response.body.analysisId;
  });

  it('POST /analysis/change - should reject invalid payload with 400 Bad Request', async () => {
    const invalidPayload = {
      repository: 'demo-ecommerce',
      changedFiles: [], // empty changedFiles violates schema
    };

    await request(app.getHttpServer())
      .post('/analysis/change')
      .send(invalidPayload)
      .expect(400);
  });

  it('GET /analysis/change/:id - should retrieve previously created analysis record', async () => {
    expect(createdAnalysisId).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(`/analysis/change/${createdAnalysisId}`)
      .expect(200);

    expect(response.body.analysisId).toBe(createdAnalysisId);
    expect(response.body.status).toBe('COMPLETED');
    expect(response.body.repository).toBe('demo-ecommerce');
    expect(response.body.result).toBeDefined();
    expect(response.body.startedAt).toBeDefined();
  });

  it('GET /analysis/change/:id - should return 404 for unknown analysis ID', async () => {
    await request(app.getHttpServer())
      .get('/analysis/change/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });
});

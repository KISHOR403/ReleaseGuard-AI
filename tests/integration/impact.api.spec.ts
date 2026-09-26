import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../apps/api/src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('Impact Analysis API (Integration)', () => {
  let app: INestApplication;

  const fixturePath = path.resolve(__dirname, '../fixtures/impact-fixture.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

  beforeAll(async () => {
    process.env.AI_PROVIDER = 'mock';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  let createdAnalysisId: string;

  describe('29. POST /analysis/impact', () => {
    it('should process repository snapshot impact analysis and return 200 with structured result', async () => {
      const response = await request(app.getHttpServer())
        .post('/analysis/impact')
        .send(fixture)
        .expect(201); // NestJS default @Post status code is 201

      expect(response.body).toBeDefined();
      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.analysisId).toBeDefined();
      expect(response.body.result).toBeDefined();

      createdAnalysisId = response.body.analysisId;

      const result = response.body.result;
      expect(result.blastRadiusScore).toBeGreaterThan(0);
      expect(result.directImpact.count).toBeGreaterThan(0);
      expect(result.transitiveImpact.count).toBeGreaterThan(0);
      expect(result.graph.nodes.length).toBeGreaterThan(0);
      expect(result.graph.edges.length).toBeGreaterThan(0);
    });

    it('31. should reject invalid input with 400 Bad Request', async () => {
      const invalidPayload = {
        repositorySnapshot: {
          files: [], // Minimum 1 file required
        },
      };

      const response = await request(app.getHttpServer())
        .post('/analysis/impact')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.message).toContain('Invalid ImpactAnalysisInput');
    });
  });

  describe('30. GET /analysis/impact/:id', () => {
    it('should retrieve persisted impact analysis by id', async () => {
      if (!createdAnalysisId) return;

      const response = await request(app.getHttpServer())
        .get(`/analysis/impact/${createdAnalysisId}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.analysisId).toBe(createdAnalysisId);
      expect(response.body.type).toBe('IMPACT_ANALYSIS');
      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.result).toBeDefined();
    });

    it('32. should return 404 for non-existent analysis id', async () => {
      await request(app.getHttpServer())
        .get('/analysis/impact/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});

import * as fs from 'fs';
import * as path from 'path';
import { ChangeIntelligenceAgent } from '../src/agents/change-intelligence-agent';
import { ChangeAnalysisInput } from '../src/schemas/change-analysis.schema';
import { LLMClient, MockLLMProvider } from '@releaseguard/ai';

describe('ChangeIntelligenceAgent', () => {
  let paymentFixture: ChangeAnalysisInput;

  beforeAll(() => {
    const fixturePath = path.resolve(__dirname, '../../../tests/fixtures/payment-change.json');
    const raw = fs.readFileSync(fixturePath, 'utf-8');
    paymentFixture = JSON.parse(raw);
  });

  it('11. should successfully execute change analysis using realistic payment fixture', async () => {
    const mockProvider = new MockLLMProvider({
      cannedResponse: JSON.stringify({
        summary: 'Payment service was upgraded to Stripe SDK with idempotency keys and new status checking endpoint.',
        changeType: 'API',
        changedAreas: [
          {
            name: 'payment',
            type: 'service',
            impact: 'HIGH',
          },
        ],
        affectedComponents: ['PaymentController', 'PaymentService'],
        affectedApis: [
          {
            method: 'POST',
            path: '/api/v1/payments/charge',
            sourceFile: 'src/payment/controller.ts',
            confidence: 0.96,
          },
          {
            method: 'GET',
            path: '/api/v1/payments/status/:transactionId',
            sourceFile: 'src/payment/controller.ts',
            confidence: 0.94,
          },
        ],
        riskIndicators: [
          {
            type: 'API_ENDPOINT_CHANGE',
            description: 'API endpoint route modified to /api/v1/payments.',
            evidence: ['src/payment/controller.ts', 'POST /api/v1/payments/charge'],
            confidence: 0.95,
          },
          {
            type: 'PAYMENT_GATEWAY_INTEGRATION',
            description: 'Direct integration with external Stripe payment API added.',
            evidence: ['src/payment/service.ts', 'Stripe.charges.create'],
            confidence: 0.95,
          },
        ],
        testImplications: [
          {
            changedFile: 'src/payment/service.ts',
            candidateTests: ['src/payment/service.test.ts'],
            recommendation: 'Execute payment service tests against mock Stripe responses.',
          },
        ],
        confidence: 0.94,
        unknowns: [],
      }),
    });

    const client = new LLMClient({ provider: mockProvider });
    const agent = new ChangeIntelligenceAgent(client);

    const output = await agent.analyzeChange(paymentFixture);

    expect(output.result.summary).toContain('Payment service was upgraded');
    expect(output.result.changeType).toBe('API'); // 7. Change type detection
    expect(output.result.changedAreas[0]).toEqual({
      name: 'payment',
      type: 'service',
      impact: 'HIGH',
    });

    // Verify evidence is present in risk indicators
    expect(output.result.riskIndicators.length).toBeGreaterThan(0);
    for (const indicator of output.result.riskIndicators) {
      expect(indicator.evidence.length).toBeGreaterThan(0);
      expect(indicator.confidence).toBeGreaterThan(0);
    }

    // Verify detected APIs and Candidate Tests
    expect(output.result.affectedApis.some((a) => a.path.includes('/api/v1/payments/charge'))).toBe(true);
    expect(output.result.testImplications.some((t) => t.candidateTests.includes('src/payment/service.test.ts'))).toBe(true);
    expect(output.deterministicSummary.totalFiles).toBe(4);
  });

  it('9. should handle invalid LLM output and auto-correct via structured retry', async () => {
    let callCount = 0;
    const mockProvider = new MockLLMProvider();

    // First call returns malformed JSON, second call returns valid JSON
    jest.spyOn(mockProvider, 'analyze').mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          content: 'Not valid JSON at all! Just conversational text.',
          model: 'mock',
          provider: 'mock',
        };
      }
      return {
        content: JSON.stringify({
          summary: 'Auto-corrected valid response.',
          changeType: 'REFACTOR',
          changedAreas: [{ name: 'payment', type: 'service', impact: 'MEDIUM' }],
          affectedComponents: ['PaymentService'],
          affectedApis: [],
          riskIndicators: [],
          testImplications: [],
          confidence: 0.88,
          unknowns: [],
        }),
        model: 'mock',
        provider: 'mock',
      };
    });

    const client = new LLMClient({ provider: mockProvider, maxRetries: 2 });
    const agent = new ChangeIntelligenceAgent(client);

    const output = await agent.analyzeChange(paymentFixture);
    expect(callCount).toBe(2); // Retried once and succeeded!
    expect(output.result.summary).toBe('Auto-corrected valid response.');
  });

  it('10. should fail when LLM provider throws or consistently produces invalid output', async () => {
    const failingProvider = new MockLLMProvider({
      shouldFail: true,
      failureError: 'Google API quota exhausted or connection refused',
    });

    const client = new LLMClient({ provider: failingProvider, maxRetries: 1 });
    const agent = new ChangeIntelligenceAgent(client);

    await expect(agent.analyzeChange(paymentFixture)).rejects.toThrow(
      /Google API quota exhausted or connection refused/
    );
  });
});

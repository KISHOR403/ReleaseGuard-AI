import { LLMClient, MockLLMProvider } from '@releaseguard/ai';
import { ImpactAnalysisAgent } from '../src/agents/impact-analysis-agent';
import { ImpactAnalysisResultSchema } from '../src/schemas/impact-analysis.schema';
import * as fs from 'fs';
import * as path from 'path';

describe('ImpactAnalysisAgent (End-to-End)', () => {
  const fixturePath = path.resolve(__dirname, '../../../tests/fixtures/impact-fixture.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

  const mockProvider = new MockLLMProvider();
  mockProvider.setCannedResponse(JSON.stringify({
    summary: 'Modification to PaymentService triggers transitive blast radius through OrderService, CheckoutService, and NotificationWorker up to depth 4. Identified 2 breaking API changes and 2 critical regression test suites.',
  }));

  const llmClient = new LLMClient({ provider: mockProvider });
  const agent = new ImpactAnalysisAgent(llmClient);

  it('should analyze realistic e-commerce payment change and construct full blast radius graph', async () => {
    const { result, provider } = await agent.analyzeImpact(fixture);

    expect(provider).toBe('mock');
    expect(result).toBeDefined();

    // Strict schema compliance
    expect(() => ImpactAnalysisResultSchema.parse(result)).not.toThrow();

    // 1. Direct Impact
    const directFilePaths = result.directImpact.nodes.map((n) => n.path).filter(Boolean);
    expect(directFilePaths).toContain('src/payment/payment.service.ts');

    // 2. Transitive Impact (OrderService -> CheckoutService -> CheckoutController / NotificationWorker)
    const transitivePaths = result.transitiveImpact.nodes.map((n) => n.path).filter(Boolean);
    expect(transitivePaths).toContain('src/order/order.service.ts');
    expect(transitivePaths).toContain('src/checkout/checkout.service.ts');
    expect(transitivePaths).toContain('src/notification/notification.worker.ts');

    // 3. Max Depth should reach at least 3 or 4 (PaymentService -> OrderService -> CheckoutService -> CheckoutController/Worker)
    expect(result.transitiveImpact.maxDepth).toBeGreaterThanOrEqual(3);

    // 4. API Impact
    const breakingApi = result.affectedApis.find((a) => a.changeType === 'BREAKING');
    expect(breakingApi).toBeDefined();

    // 5. Database Impact
    const paymentsDb = result.affectedDatabase.find((d) => d.name.toLowerCase().includes('payment'));
    expect(paymentsDb).toBeDefined();

    // 6. Test Impact (Verified test dependencies)
    const verifiedTests = result.affectedTests.filter((t) => t.relationship === 'VERIFIED_IMPORT');
    expect(verifiedTests.length).toBeGreaterThanOrEqual(1);

    // 7. Blast Radius Score & Breakdown
    expect(result.blastRadiusScore).toBeGreaterThan(0);
    expect(result.blastRadiusScore).toBeLessThanOrEqual(100);
    expect(result.breakdown.directNodes).toBeGreaterThan(0);
    expect(result.breakdown.transitiveNodes).toBeGreaterThan(0);
  });
});

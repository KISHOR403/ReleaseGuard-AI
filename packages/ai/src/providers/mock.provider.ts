import { LLMProvider, LLMRequest, LLMResponse } from './llm-provider.interface';

export class MockLLMProvider implements LLMProvider {
  readonly name = 'mock';
  private cannedResponse?: string;
  private shouldFail = false;
  private failureError = 'Simulated LLM Provider failure';

  constructor(options?: {
    cannedResponse?: string;
    shouldFail?: boolean;
    failureError?: string;
  }) {
    if (options?.cannedResponse) this.cannedResponse = options.cannedResponse;
    if (options?.shouldFail !== undefined) this.shouldFail = options.shouldFail;
    if (options?.failureError) this.failureError = options.failureError;
  }

  setCannedResponse(response: string): void {
    this.cannedResponse = response;
  }

  setShouldFail(shouldFail: boolean, error?: string): void {
    this.shouldFail = shouldFail;
    if (error) this.failureError = error;
  }

  async analyze(_request: LLMRequest): Promise<LLMResponse> {
    if (this.shouldFail) {
      throw new Error(this.failureError);
    }

    const content =
      this.cannedResponse ||
      JSON.stringify({
        summary: 'Mock analysis: Payment processing logic was modified.',
        changeType: 'API',
        changedAreas: [
          {
            name: 'payment',
            type: 'service',
            impact: 'HIGH',
          },
        ],
        affectedComponents: ['PaymentService', 'PaymentController'],
        affectedApis: [
          {
            method: 'POST',
            path: '/api/payment/charge',
            sourceFile: 'src/payment/controller.ts',
            confidence: 0.95,
          },
        ],
        riskIndicators: [
          {
            type: 'API_CHANGE',
            description: 'Payment API implementation changed in controller.',
            evidence: ['src/payment/controller.ts', 'POST /api/payment/charge'],
            confidence: 0.95,
          },
        ],
        testImplications: [
          {
            changedFile: 'src/payment/service.ts',
            candidateTests: ['src/payment/service.test.ts'],
            recommendation: 'Execute payment service unit and integration tests.',
          },
        ],
        confidence: 0.92,
        unknowns: [],
      });

    return {
      content,
      tokensUsed: {
        inputTokens: 120,
        outputTokens: 85,
        totalTokens: 205,
      },
      model: 'mock-model-v1',
      provider: this.name,
    };
  }
}

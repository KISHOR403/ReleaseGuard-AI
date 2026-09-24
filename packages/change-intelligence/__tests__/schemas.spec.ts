import {
  ChangeAnalysisInputSchema,
  ChangeAnalysisResultSchema,
  ImpactLevelEnum,
  ChangeTypeEnum,
} from '../src/schemas/change-analysis.schema';

describe('8. Zod Schema Validation', () => {
  it('should validate a valid ChangeAnalysisInput', () => {
    const valid = {
      repository: 'test-repo',
      baseBranch: 'main',
      targetBranch: 'feature/auth',
      changedFiles: [
        {
          path: 'src/auth/service.ts',
          status: 'modified',
          additions: 10,
          deletions: 2,
        },
      ],
    };
    const parsed = ChangeAnalysisInputSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('should fail when changedFiles is empty', () => {
    const invalid = {
      repository: 'test-repo',
      changedFiles: [],
    };
    const parsed = ChangeAnalysisInputSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('should validate a complete ChangeAnalysisResult', () => {
    const validResult = {
      summary: 'Payment service was updated to integrate Stripe SDK.',
      changeType: 'API',
      changedAreas: [
        {
          name: 'payment',
          type: 'service',
          impact: 'HIGH',
        },
      ],
      affectedComponents: ['PaymentService'],
      affectedApis: [
        {
          method: 'POST',
          path: '/api/v1/payments/charge',
          sourceFile: 'src/payment/controller.ts',
          confidence: 0.95,
        },
      ],
      riskIndicators: [
        {
          type: 'API_CHANGE',
          description: 'Payment API changed.',
          evidence: ['src/payment/controller.ts', 'POST /api/v1/payments/charge'],
          confidence: 0.94,
        },
      ],
      testImplications: [
        {
          changedFile: 'src/payment/service.ts',
          candidateTests: ['src/payment/service.test.ts'],
        },
      ],
      confidence: 0.92,
      unknowns: [],
    };

    const parsed = ChangeAnalysisResultSchema.safeParse(validResult);
    expect(parsed.success).toBe(true);
  });

  it('should fail if riskIndicator is missing evidence', () => {
    const invalidResult = {
      summary: 'Some change',
      changeType: 'FEATURE',
      confidence: 0.9,
      riskIndicators: [
        {
          type: 'HIGH_RISK',
          description: 'Risky change',
          evidence: [], // Evidence cannot be empty!
          confidence: 0.8,
        },
      ],
    };

    const parsed = ChangeAnalysisResultSchema.safeParse(invalidResult);
    expect(parsed.success).toBe(false);
  });

  it('should enforce strict ChangeType and ImpactLevel enums', () => {
    expect(() => ChangeTypeEnum.parse('INVALID_TYPE')).toThrow();
    expect(ChangeTypeEnum.parse('API')).toBe('API');

    expect(() => ImpactLevelEnum.parse('DANGEROUS')).toThrow();
    expect(ImpactLevelEnum.parse('CRITICAL')).toBe('CRITICAL');
  });
});

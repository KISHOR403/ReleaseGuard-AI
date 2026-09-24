import { FileAnalyzer } from '../src/analyzers/file-analyzer';
import { DiffAnalyzer } from '../src/analyzers/diff-analyzer';
import { ApiAnalyzer } from '../src/analyzers/api-analyzer';
import { DependencyAnalyzer } from '../src/analyzers/dependency-analyzer';
import { CandidateTestDetector } from '../src/analyzers/candidate-test-detector';

describe('Deterministic Analyzers', () => {
  describe('FileAnalyzer (File & TypeScript Classification)', () => {
    it('1. should correctly classify frontend React components, hooks, and pages', () => {
      const component = FileAnalyzer.analyze('apps/web/src/components/button.tsx');
      expect(component.category).toBe('frontend_component');
      expect(component.language).toBe('typescript');

      const hook = FileAnalyzer.analyze('apps/web/src/hooks/use-auth.ts');
      expect(hook.category).toBe('frontend_hook');
      expect(hook.language).toBe('typescript');
      expect(hook.isSecurityRelated).toBe(true);

      const page = FileAnalyzer.analyze('apps/web/src/app/dashboard/page.tsx');
      expect(page.category).toBe('frontend_page');
    });

    it('2. should correctly classify backend controllers, services, and repositories with domain hints', () => {
      const controller = FileAnalyzer.analyze('src/payment/controller.ts');
      expect(controller.category).toBe('backend_controller');
      expect(controller.domainHint).toBe('payment');
      expect(controller.isApiRelated).toBe(true);
      expect(controller.language).toBe('typescript');

      const service = FileAnalyzer.analyze('apps/api/src/payment/service.ts');
      expect(service.category).toBe('backend_service');
      expect(service.domainHint).toBe('payment');

      const repo = FileAnalyzer.analyze('src/order/repository.ts');
      expect(repo.category).toBe('backend_repository');
      expect(repo.domainHint).toBe('order');
    });

    it('3. should correctly detect unit, integration, and E2E test files', () => {
      const unit = FileAnalyzer.analyze('src/payment/service.test.ts');
      expect(unit.isTest).toBe(true);
      expect(unit.category).toBe('test_unit');

      const spec = FileAnalyzer.analyze('src/payment/service.spec.ts');
      expect(spec.isTest).toBe(true);
      expect(spec.category).toBe('test_unit');

      const integration = FileAnalyzer.analyze('tests/integration/order.test.ts');
      expect(integration.isTest).toBe(true);
      expect(integration.category).toBe('test_integration');

      const e2e = FileAnalyzer.analyze('tests/e2e/checkout.cy.ts');
      expect(e2e.isTest).toBe(true);
      expect(e2e.category).toBe('test_e2e');
    });

    it('should correctly classify database migrations and infrastructure configs', () => {
      const migration = FileAnalyzer.analyze('migrations/20260924_create_users.sql');
      expect(migration.isDatabase).toBe(true);
      expect(migration.category).toBe('database_migration');
      expect(migration.language).toBe('sql');

      const docker = FileAnalyzer.analyze('Dockerfile');
      expect(docker.category).toBe('infra_docker');

      const k8s = FileAnalyzer.analyze('k8s/deployment.yaml');
      expect(k8s.category).toBe('infra_k8s');
    });
  });

  describe('DependencyAnalyzer (Dependency-File Detection)', () => {
    it('4. should detect package.json, lockfiles, and identify added, removed, and version upgrades', () => {
      const patch = `
+    "stripe": "^14.15.0",
+    "jsonwebtoken": "^9.0.2",
-    "braintree": "^3.0.0",
-    "lodash": "^4.17.20",
+    "lodash": "^4.17.21"
      `;

      const result = DependencyAnalyzer.analyze('package.json', patch);
      expect(result.isDependencyFile).toBe(true);
      expect(result.addedDependencies).toContain('stripe@^14.15.0');
      expect(result.addedDependencies).toContain('jsonwebtoken@^9.0.2');
      expect(result.removedDependencies).toContain('braintree@^3.0.0');
      expect(result.versionChanges).toEqual([
        { package: 'lodash', from: '^4.17.20', to: '^4.17.21' },
      ]);

      // Check risk indicators: jsonwebtoken (sensitive) and braintree (removed)
      expect(result.riskIndicators.some((r) => r.type === 'SENSITIVE_DEPENDENCY_ADDED')).toBe(true);
      expect(result.riskIndicators.some((r) => r.type === 'DEPENDENCY_REMOVAL')).toBe(true);
    });

    it('should identify lockfiles and requirements.txt as dependency files', () => {
      const lock = DependencyAnalyzer.analyze('package-lock.json', '+ some diff');
      expect(lock.isDependencyFile).toBe(true);
      expect(lock.riskIndicators.length).toBeGreaterThan(0);

      const py = DependencyAnalyzer.analyze('requirements.txt', '+ flask==3.0.0');
      expect(py.isDependencyFile).toBe(true);
    });
  });

  describe('ApiAnalyzer (API Route Detection)', () => {
    it('5. should detect NestJS controller routes (@Controller + @Get/@Post)', () => {
      const patch = `
@Controller('/api/v1/payments')
export class PaymentController {
  @Post('charge')
  createCharge() {}

  @Get('status/:id')
  getStatus() {}
}
      `;

      const result = ApiAnalyzer.analyzeFile('src/payment/controller.ts', patch);
      expect(result.detectedApis).toHaveLength(2);
      expect(result.detectedApis).toEqual(
        expect.arrayContaining([
          {
            method: 'POST',
            path: '/api/v1/payments/charge',
            sourceFile: 'src/payment/controller.ts',
            confidence: 0.94,
          },
          {
            method: 'GET',
            path: '/api/v1/payments/status/:id',
            sourceFile: 'src/payment/controller.ts',
            confidence: 0.94,
          },
        ])
      );
    });

    it('should detect Express routes app.get and router.post', () => {
      const patch = `
router.post('/checkout', handleCheckout);
app.get('/health', getHealth);
      `;

      const result = ApiAnalyzer.analyzeFile('src/routes.js', patch);
      expect(result.detectedApis).toHaveLength(2);
      expect(result.detectedApis[0]).toMatchObject({ method: 'POST', path: '/checkout' });
      expect(result.detectedApis[1]).toMatchObject({ method: 'GET', path: '/health' });
    });
  });

  describe('DiffAnalyzer (Diff Statistics)', () => {
    it('6. should extract additions, deletions, functions, imports, and env references', () => {
      const patch = `
@@ -1,5 +1,10 @@
 import { Injectable } from '@nestjs/common';
-import { OldUtil } from './util';
+import { NewUtil } from './util';
 
+async function processRefund(id: string) {
+  const apiKey = process.env.PAYMENT_API_KEY;
+  return true;
+}
      `;

      const stats = DiffAnalyzer.analyze(patch);
      expect(stats.additions).toBe(5);
      expect(stats.deletions).toBe(1);
      expect(stats.changedLines).toBe(6);
      expect(stats.addedFunctions).toContain('processRefund');
      expect(stats.changedImports).toContain('+ ./util');
      expect(stats.changedImports).toContain('- ./util');
      expect(stats.changedEnvReferences).toContain('PAYMENT_API_KEY');
    });
  });

  describe('CandidateTestDetector', () => {
    it('should find candidate tests for non-test files', () => {
      const testImp = CandidateTestDetector.detectCandidateTests(
        'src/payment/service.ts',
        ['src/payment/service.test.ts', 'test/other.test.ts']
      );
      expect(testImp.changedFile).toBe('src/payment/service.ts');
      expect(testImp.candidateTests).toContain('src/payment/service.test.ts');
      expect(testImp.candidateTests).not.toContain('test/other.test.ts');
    });
  });
});

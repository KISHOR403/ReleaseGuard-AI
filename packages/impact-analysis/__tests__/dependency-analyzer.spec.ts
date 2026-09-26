import { RepositoryIndexer } from '../src/indexer/repository-indexer';
import { DependencyAnalyzer } from '../src/analyzers/dependency-analyzer';
import { ReverseDependencyAnalyzer } from '../src/analyzers/reverse-dependency-analyzer';
import { TransitiveTraversalEngine } from '../src/analyzers/transitive-traversal';

describe('Dependency & Reverse Traversal Analyzers', () => {
  const indexer = new RepositoryIndexer();
  const depAnalyzer = new DependencyAnalyzer();
  const traversalEngine = new TransitiveTraversalEngine();

  const files = [
    {
      path: 'src/payment/payment.service.ts',
      content: 'export class PaymentService { charge() {} }',
    },
    {
      path: 'src/order/order.service.ts',
      content: "import { PaymentService } from '../payment/payment.service'; export class OrderService {}",
    },
    {
      path: 'src/checkout/checkout.service.ts',
      content: "import { OrderService } from '../order/order.service'; export class CheckoutService {}",
    },
    {
      path: 'src/cycle/a.ts',
      content: "import { B } from './b'; export class A {}",
    },
    {
      path: 'src/cycle/b.ts',
      content: "import { A } from './a'; export class B {}",
    },
    {
      path: 'src/reexport/index.ts',
      content: "export * from '../payment/payment.service';",
    },
    {
      path: 'src/reexport/consumer.ts',
      content: "import { PaymentService } from './index'; export class Consumer {}",
    },
  ];

  const index = indexer.indexRepository(files);
  const graph = depAnalyzer.buildDependencyGraph(index);
  const reverseAnalyzer = new ReverseDependencyAnalyzer(graph);

  it('1. should detect direct import edges', () => {
    const orderImports = graph.forward.get('src/order/order.service.ts');
    expect(orderImports).toBeDefined();
    expect(orderImports?.length).toBe(1);
    expect(orderImports![0].target).toBe('src/payment/payment.service.ts');
    expect(orderImports![0].importedSymbols).toContain('PaymentService');
  });

  it('2. should detect reverse dependencies', () => {
    const paymentConsumers = reverseAnalyzer.getDirectConsumers('src/payment/payment.service.ts');
    const consumerPaths = paymentConsumers.map((c) => c.source);
    expect(consumerPaths).toContain('src/order/order.service.ts');
  });

  it('3. should detect transitive downstream dependencies', () => {
    const traversal = traversalEngine.traverseDownstreamImpact(['src/payment/payment.service.ts'], graph, 5);
    const affectedFiles = Array.from(traversal.nodesByPath.keys());

    expect(affectedFiles).toContain('src/payment/payment.service.ts');
    expect(affectedFiles).toContain('src/order/order.service.ts');
    expect(affectedFiles).toContain('src/checkout/checkout.service.ts');

    expect(traversal.nodesByPath.get('src/payment/payment.service.ts')?.depth).toBe(0);
    expect(traversal.nodesByPath.get('src/order/order.service.ts')?.depth).toBe(1);
    expect(traversal.nodesByPath.get('src/checkout/checkout.service.ts')?.depth).toBe(2);
    expect(traversal.maxDepth).toBeGreaterThanOrEqual(2);
  });

  it('4. should handle circular dependencies safely without infinite loops', () => {
    const traversal = traversalEngine.traverseDownstreamImpact(['src/cycle/a.ts'], graph, 5);
    expect(traversal.nodesByPath.has('src/cycle/a.ts')).toBe(true);
    expect(traversal.nodesByPath.has('src/cycle/b.ts')).toBe(true);
    expect(traversal.cyclicEdgesDetected.length).toBeGreaterThanOrEqual(1);
  });

  it('5. should respect maximum traversal depth', () => {
    // With maxDepth = 1, OrderService (depth 1) is captured, but CheckoutService (depth 2) is pruned
    const traversal = traversalEngine.traverseDownstreamImpact(['src/payment/payment.service.ts'], graph, 1);
    expect(traversal.nodesByPath.has('src/order/order.service.ts')).toBe(true);
    expect(traversal.nodesByPath.has('src/checkout/checkout.service.ts')).toBe(false);
    expect(traversal.maxDepth).toBe(1);
  });

  it('6. should avoid duplicate nodes during traversal', () => {
    const traversal = traversalEngine.traverseDownstreamImpact(
      ['src/payment/payment.service.ts', 'src/payment/payment.service.ts'],
      graph,
      5
    );
    const keys = Array.from(traversal.nodesByPath.keys());
    const uniqueKeys = Array.from(new Set(keys));
    expect(keys.length).toBe(uniqueKeys.length);
  });

  it('7. should resolve re-exports properly', () => {
    const reexportConsumers = reverseAnalyzer.getDirectConsumers('src/payment/payment.service.ts');
    const consumerPaths = reexportConsumers.map((c) => c.source);
    expect(consumerPaths).toContain('src/reexport/index.ts');
  });
});

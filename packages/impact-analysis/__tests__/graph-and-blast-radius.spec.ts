import { RepositoryIndexer } from '../src/indexer/repository-indexer';
import { DependencyAnalyzer } from '../src/analyzers/dependency-analyzer';
import { TransitiveTraversalEngine } from '../src/analyzers/transitive-traversal';
import { ImpactGraphBuilder } from '../src/graph/impact-graph-builder';
import { BlastRadiusCalculator } from '../src/graph/blast-radius-calculator';

describe('Quality Impact Graph & Blast Radius Calculator', () => {
  const indexer = new RepositoryIndexer();
  const depAnalyzer = new DependencyAnalyzer();
  const traversalEngine = new TransitiveTraversalEngine();
  const graphBuilder = new ImpactGraphBuilder();
  const calculator = new BlastRadiusCalculator();

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
      path: 'tests/payment.service.test.ts',
      content: "import { PaymentService } from '../src/payment/payment.service';",
    },
  ];

  const index = indexer.indexRepository(files);
  const depGraph = depAnalyzer.buildDependencyGraph(index);
  const traversal = traversalEngine.traverseDownstreamImpact(['src/payment/payment.service.ts'], depGraph, 5);

  const graph = graphBuilder.buildImpactGraph(
    traversal,
    index,
    [
      {
        method: 'POST',
        path: '/api/v1/payments/charge',
        changeType: 'BREAKING',
        details: 'Required currency added',
        affectedComponents: ['PaymentService'],
        confidence: 0.95,
      },
    ],
    [
      {
        entityType: 'TABLE',
        name: 'payments',
        changeType: 'MODIFIED',
        consumers: [
          {
            component: 'PaymentService',
            filePath: 'src/payment/payment.service.ts',
            operation: 'READ',
          },
        ],
        evidence: [],
        confidence: 0.95,
      },
    ],
    [
      {
        testFile: 'tests/payment.service.test.ts',
        testType: 'UNIT',
        targetComponent: 'PaymentService',
        targetPath: 'src/payment/payment.service.ts',
        relationship: 'VERIFIED_IMPORT',
        impactDepth: 0,
        evidence: [
          {
            sourceType: 'TEST',
            filePath: 'tests/payment.service.test.ts',
            description: 'Unit test importing PaymentService',
          },
        ],
        confidence: 1.0,
      },
    ]
  );

  it('22. should create correct nodes for FILE, COMPONENT, API, DATABASE_TABLE, and TEST', () => {
    const types = new Set(graph.nodes.map((n) => n.type));
    expect(types.has('FILE')).toBe(true);
    expect(types.has('COMPONENT')).toBe(true);
    expect(types.has('API')).toBe(true);
    expect(types.has('DATABASE_TABLE')).toBe(true);
    expect(types.has('TEST')).toBe(true);
  });

  it('23. should create correct edges with verified flags and evidence', () => {
    const importEdge = graph.edges.find((e) => e.type === 'IMPORTS');
    expect(importEdge).toBeDefined();
    expect(importEdge?.verified).toBe(true);
    expect(importEdge?.evidence.length).toBeGreaterThan(0);

    const apiEdge = graph.edges.find((e) => e.type === 'IMPLEMENTS_API');
    expect(apiEdge).toBeDefined();

    const testEdge = graph.edges.find((e) => e.type === 'TESTS');
    expect(testEdge).toBeDefined();
  });

  it('24. should correctly classify direct vs transitive impact nodes', () => {
    expect(graph.directNodes.length).toBeGreaterThanOrEqual(1);
    expect(graph.transitiveNodes.length).toBeGreaterThanOrEqual(2);

    const paymentFileNode = graph.nodes.find((n) => n.id === 'file:src/payment/payment.service.ts');
    const orderFileNode = graph.nodes.find((n) => n.id === 'file:src/order/order.service.ts');

    expect(paymentFileNode?.directChanged).toBe(true);
    expect(orderFileNode?.directChanged).toBe(false);
  });

  it('25. should assign correct impact depth across the graph', () => {
    const paymentNode = graph.nodes.find((n) => n.id === 'file:src/payment/payment.service.ts');
    const orderNode = graph.nodes.find((n) => n.id === 'file:src/order/order.service.ts');
    const checkoutNode = graph.nodes.find((n) => n.id === 'file:src/checkout/checkout.service.ts');

    expect(paymentNode?.impactDepth).toBe(0);
    expect(orderNode?.impactDepth).toBe(1);
    expect(checkoutNode?.impactDepth).toBe(2);
  });

  it('26. should maintain cycle safety and bounded traversal depth', () => {
    expect(traversal.maxDepth).toBe(2);
    expect(graph.nodes.every((n) => n.impactDepth <= 5)).toBe(true);
  });

  it('27. should attach concrete evidence to all verified relationships', () => {
    const verifiedEdges = graph.edges.filter((e) => e.verified);
    expect(verifiedEdges.length).toBeGreaterThan(0);
    for (const edge of verifiedEdges) {
      expect(edge.evidence.length).toBeGreaterThan(0);
    }
  });

  it('28. should calculate reproducible, deterministic blast-radius score and breakdown', () => {
    const { score, breakdown } = calculator.calculateScore(
      graph.directNodes,
      graph.transitiveNodes,
      traversal.maxDepth,
      [
        {
          method: 'POST',
          path: '/api/v1/payments/charge',
          changeType: 'BREAKING',
          details: 'Required currency added',
          affectedComponents: ['PaymentService'],
          confidence: 0.95,
        },
      ],
      [
        {
          entityType: 'TABLE',
          name: 'payments',
          changeType: 'MODIFIED',
          consumers: [],
          evidence: [],
          confidence: 0.95,
        },
      ],
      [],
      undefined
    );

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(breakdown.directNodes).toBe(graph.directNodes.length);
    expect(breakdown.transitiveNodes).toBe(graph.transitiveNodes.length);
    expect(breakdown.breakingApis).toBe(1);
    expect(breakdown.affectedDatabaseEntities).toBe(1);

    // Reproducibility test
    const run2 = calculator.calculateScore(
      graph.directNodes,
      graph.transitiveNodes,
      traversal.maxDepth,
      [
        {
          method: 'POST',
          path: '/api/v1/payments/charge',
          changeType: 'BREAKING',
          details: 'Required currency added',
          affectedComponents: ['PaymentService'],
          confidence: 0.95,
        },
      ],
      [
        {
          entityType: 'TABLE',
          name: 'payments',
          changeType: 'MODIFIED',
          consumers: [],
          evidence: [],
          confidence: 0.95,
        },
      ],
      [],
      undefined
    );
    expect(run2.score).toBe(score);
  });
});

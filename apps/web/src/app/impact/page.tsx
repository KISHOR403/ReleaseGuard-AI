'use client';

import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Network,
  ShieldAlert,
  ArrowRight,
  Database,
  Globe,
  Beaker,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileCode,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Filter,
  Code2,
  ChevronRight,
} from 'lucide-react';
import type {
  ImpactAnalysisResult,
  ImpactNode,
} from '@releaseguard/impact-analysis';

// Full realistic e-commerce payment fixture snapshot
const DEFAULT_IMPACT_PAYLOAD = {
  repository: {
    name: 'demo-ecommerce',
    language: 'typescript',
    framework: 'nestjs',
  },
  changeAnalysis: {
    summary: 'Payment processing controller and service modified with new charge endpoint and Stripe payment handling.',
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
        sourceFile: 'src/payment/payment.controller.ts',
        confidence: 0.95,
      },
    ],
    riskIndicators: [
      {
        type: 'API_CHANGE',
        description: 'Payment endpoint POST /api/v1/payments/charge added or updated in payment controller.',
        evidence: ['src/payment/payment.controller.ts', 'POST /api/v1/payments/charge'],
        confidence: 0.95,
      },
    ],
    testImplications: [
      {
        changedFile: 'src/payment/payment.service.ts',
        candidateTests: ['tests/payment.service.test.ts'],
      },
    ],
    confidence: 0.94,
    unknowns: [],
  },
  repositorySnapshot: {
    files: [
      {
        path: 'src/payment/payment.repository.ts',
        content: `export class PaymentRepository {
  async findById(id: string) {
    const query = 'SELECT id, amount, currency, status FROM payments WHERE id = $1';
    return { id, query };
  }
  async savePayment(payment: { amount: number; currency: string; status: string }) {
    const query = 'INSERT INTO payments (amount, currency, status) VALUES ($1, $2, $3)';
    return { ...payment, query };
  }
}`,
      },
      {
        path: 'src/payment/payment.service.ts',
        content: `import { PaymentRepository } from './payment.repository';

export class PaymentService {
  private repository: PaymentRepository;
  constructor() {
    this.repository = new PaymentRepository();
  }
  async processCharge(amount: number, currency: string, sourceToken: string) {
    const payment = { amount, currency, sourceToken, status: 'succeeded' };
    await this.repository.savePayment(payment);
    return { transactionId: 'tx_123', status: payment.status };
  }
}`,
      },
      {
        path: 'src/payment/payment.controller.ts',
        content: `import { PaymentService } from './payment.service';

export class PaymentController {
  private paymentService: PaymentService;
  constructor() {
    this.paymentService = new PaymentService();
  }
  async createCharge(body: { amount: number; currency: string; token: string }) {
    return this.paymentService.processCharge(body.amount, body.currency, body.token);
  }
}`,
      },
      {
        path: 'src/order/order.service.ts',
        content: `import { PaymentService } from '../payment/payment.service';

export class OrderService {
  private paymentService: PaymentService;
  constructor() {
    this.paymentService = new PaymentService();
  }
  async createOrder(orderId: string, amount: number, currency: string) {
    return this.paymentService.processCharge(amount, currency, 'token_default');
  }
}`,
      },
      {
        path: 'src/checkout/checkout.service.ts',
        content: `import { OrderService } from '../order/order.service';

export class CheckoutService {
  private orderService: OrderService;
  constructor() {
    this.orderService = new OrderService();
  }
  async executeCheckout(cartId: string, total: number, currency: string) {
    return this.orderService.createOrder(\`ord_\${cartId}\`, total, currency);
  }
}`,
      },
      {
        path: 'src/checkout/checkout.controller.ts',
        content: `import { CheckoutService } from './checkout.service';

export class CheckoutController {
  private checkoutService: CheckoutService;
  constructor() {
    this.checkoutService = new CheckoutService();
  }
  async handleCheckout(cartId: string, total: number, currency: string) {
    return this.checkoutService.executeCheckout(cartId, total, currency);
  }
}`,
      },
      {
        path: 'src/notification/notification.worker.ts',
        content: `import { CheckoutService } from '../checkout/checkout.service';

export class NotificationWorker {
  private checkoutService: CheckoutService;
  constructor() {
    this.checkoutService = new CheckoutService();
  }
  async notify(cartId: string) {
    return this.checkoutService.executeCheckout(cartId, 100, 'USD');
  }
}`,
      },
      {
        path: 'tests/payment.service.test.ts',
        content: `import { PaymentService } from '../src/payment/payment.service';

describe('PaymentService Unit Tests', () => {
  it('should charge', async () => {
    const s = new PaymentService();
    expect(s).toBeDefined();
  });
});`,
      },
      {
        path: 'tests/checkout.e2e.spec.ts',
        content: `import { CheckoutController } from '../src/checkout/checkout.controller';

describe('Checkout E2E Spec', () => {
  it('should test /api/v1/checkout', async () => {
    const c = new CheckoutController();
    expect(c).toBeDefined();
  });
});`,
      },
      {
        path: 'db/migrations/001_payments.sql',
        content: 'ALTER TABLE payments ADD COLUMN currency VARCHAR(3);',
      },
    ],
  },
  openApiSpec: {
    openapi: '3.0.0',
    paths: {
      '/api/v1/payments/charge': {
        post: {
          summary: 'Create payment charge',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['amount', 'token', 'currency'],
                  properties: {
                    amount: { type: 'number' },
                    token: { type: 'string' },
                    currency: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/checkout': {
        post: {
          summary: 'Submit customer checkout',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['cartId', 'total', 'currency'],
                },
              },
            },
          },
        },
      },
    },
  },
  previousOpenApiSpec: {
    openapi: '3.0.0',
    paths: {
      '/api/v1/payments/charge': {
        post: {
          summary: 'Create payment charge',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['amount', 'token'],
                  properties: {
                    amount: { type: 'number' },
                    token: { type: 'string' },
                    currency: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/legacy/pay': {
        delete: {
          summary: 'Legacy payment cleanup',
        },
      },
    },
  },
};

export default function ImpactPage() {
  const [maxDepth, setMaxDepth] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ImpactAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  // Filters & Inspector state
  const [activeTab, setActiveTab] = useState<'graph' | 'api' | 'db' | 'tests' | 'unknowns' | 'raw'>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'DIRECT' | 'TRANSITIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const handleRunImpactAnalysis = async () => {
    setLoading(true);
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      const response = await fetch(`${apiUrl}/analysis/impact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...DEFAULT_IMPACT_PAYLOAD,
          options: { maxTraversalDepth: maxDepth },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Impact analysis request failed');
      }

      setAnalysisId(data.analysisId);
      if (data.status === 'COMPLETED' && data.result) {
        setResult(data.result);
        if (data.result.graph?.nodes?.length > 0) {
          setSelectedNodeId(data.result.graph.nodes[0].id);
        }
      } else {
        throw new Error(data.error || 'Impact analysis execution failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setAnalysisId(null);
    setError(null);
    setSelectedNodeId(null);
    setSearchQuery('');
    setTypeFilter('ALL');
    setScopeFilter('ALL');
  };

  // Filtered nodes
  const nodes = result?.graph?.nodes || [];
  const edges = result?.graph?.edges || [];

  const filteredNodes = nodes.filter((node) => {
    if (typeFilter !== 'ALL' && node.type !== typeFilter) return false;
    if (scopeFilter === 'DIRECT' && !node.directChanged) return false;
    if (scopeFilter === 'TRANSITIVE' && node.directChanged) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        node.name.toLowerCase().includes(q) ||
        (node.path && node.path.toLowerCase().includes(q)) ||
        node.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  // Group nodes by depth for hierarchy
  const nodesByDepth: Record<number, ImpactNode[]> = {};
  filteredNodes.forEach((node) => {
    const d = node.impactDepth ?? 0;
    if (!nodesByDepth[d]) nodesByDepth[d] = [];
    nodesByDepth[d].push(node);
  });
  const sortedDepths = Object.keys(nodesByDepth)
    .map(Number)
    .sort((a, b) => a - b);

  // Relationships for selected node
  const incomingEdges = edges.filter((e) => e.target === selectedNodeId);
  const outgoingEdges = edges.filter((e) => e.source === selectedNodeId);

  const getNodeTypeBadge = (type: string) => {
    switch (type) {
      case 'COMPONENT':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'API':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'DATABASE_TABLE':
      case 'DATABASE_COLUMN':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'TEST':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'FILE':
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-red-400 border-red-500/30 bg-red-500/10';
    if (score >= 45) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  };

  const getContractBadge = (changeType: string) => {
    switch (changeType) {
      case 'BREAKING':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'POTENTIALLY_BREAKING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'NON_BREAKING':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="p-6 rounded-xl bg-surface border border-surface-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center gap-1.5">
                <Network className="w-3 h-3" />
                Impact Analysis Agent
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-zinc-400 bg-surface-subtle border border-surface-border">
                Quality Impact Graph
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                Deterministic Evidence
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Quality Impact Graph & Blast Radius
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Constructs verified AST dependency edges, reverse blast-radius traversals, OpenAPI contract drift, database consumer mappings, and candidate regression test targets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-surface-subtle border border-surface-border px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-300">
              <span className="text-zinc-500">Max Depth:</span>
              <select
                aria-label="Max Traversal Depth"
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value={3} className="bg-zinc-900">3</option>
                <option value={5} className="bg-zinc-900">5 (Default)</option>
                <option value={7} className="bg-zinc-900">7</option>
                <option value={10} className="bg-zinc-900">10</option>
              </select>
            </div>

            <button
              id="reset-impact-btn"
              onClick={handleReset}
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-subtle hover:bg-surface-hover text-zinc-300 text-xs font-mono border border-surface-border transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              id="run-impact-btn"
              onClick={handleRunImpactAnalysis}
              disabled={loading}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition-colors"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Traversing Blast Radius...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Impact Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300 font-mono text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Metrics Cards */}
      {result && (
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Blast Radius Score */}
          <div className="p-4 rounded-lg bg-surface border border-surface-border space-y-1">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Blast Radius</span>
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono px-2 py-0.5 rounded border ${getScoreColor(result.blastRadiusScore)}`}>
                {result.blastRadiusScore}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">/ 100</span>
            </div>
            <div className="text-[10px] text-zinc-400 font-mono pt-1">
              Max Depth: {result.transitiveImpact.maxDepth}
            </div>
          </div>

          {/* Direct Impact */}
          <div className="p-4 rounded-lg bg-surface border border-surface-border space-y-1">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Direct Impact</span>
              <FileCode className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {result.directImpact.count}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              Depth 0 changed nodes
            </div>
          </div>

          {/* Transitive Impact */}
          <div className="p-4 rounded-lg bg-surface border border-surface-border space-y-1">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Transitive Impact</span>
              <Network className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-blue-400">
              {result.transitiveImpact.count}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              Downstream consumers
            </div>
          </div>

          {/* Affected APIs */}
          <div className="p-4 rounded-lg bg-surface border border-surface-border space-y-1">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Affected APIs</span>
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-purple-400">
                {result.affectedApis.length}
              </span>
              {result.breakdown.breakingApis > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                  {result.breakdown.breakingApis} Breaking
                </span>
              )}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              OpenAPI contract drift
            </div>
          </div>

          {/* Database Entities */}
          <div className="p-4 rounded-lg bg-surface border border-surface-border space-y-1">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Database</span>
              <Database className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {result.affectedDatabase.length}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              Entities & consumers
            </div>
          </div>

          {/* Candidate Tests */}
          <div className="p-4 rounded-lg bg-surface border border-surface-border space-y-1">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Candidate Tests</span>
              <Beaker className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {result.affectedTests.length}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              Verified test targets
            </div>
          </div>
        </section>
      )}

      {/* Main Workbench Tabs */}
      <div className="border-b border-surface-border flex items-center justify-between gap-4">
        <nav className="flex space-x-1" aria-label="Tabs">
          {[
            { id: 'graph', label: 'Quality Impact Graph', icon: Network, count: nodes.length },
            { id: 'api', label: 'API Contract Drift', icon: Globe, count: result?.affectedApis.length },
            { id: 'db', label: 'Database Blast-Radius', icon: Database, count: result?.affectedDatabase.length },
            { id: 'tests', label: 'Test Impact Matrix', icon: Beaker, count: result?.affectedTests.length },
            { id: 'unknowns', label: 'Uncertainty / Unknowns', icon: HelpCircle, count: result?.unknowns.length },
            { id: 'raw', label: 'Graph JSON', icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-brand-500 text-white bg-surface-subtle/50'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-400' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    isActive ? 'bg-brand-500/20 text-brand-300' : 'bg-surface-subtle text-zinc-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {result && (
          <div className="text-xs font-mono text-zinc-500 hidden md:flex items-center gap-3">
            {analysisId && (
              <span className="px-1.5 py-0.5 rounded bg-surface-subtle border border-surface-border text-[11px] text-zinc-400">
                Run: {analysisId}
              </span>
            )}
            <span>Confidence: {(result.confidence * 100).toFixed(0)}%</span>
            <span>•</span>
            <span>Verified Edges: {edges.filter((e) => e.verified).length}/{edges.length}</span>
          </div>
        )}
      </div>

      {/* Tab 1: Quality Impact Graph */}
      {activeTab === 'graph' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-surface border border-surface-border text-xs font-mono">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-500">Filter:</span>
              <select
                aria-label="Filter by Node Type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-surface-subtle border border-surface-border text-zinc-200 px-2 py-1 rounded text-xs focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="COMPONENT">Components Only</option>
                <option value="API">APIs Only</option>
                <option value="DATABASE_TABLE">Database Tables</option>
                <option value="TEST">Tests Only</option>
              </select>

              <div className="flex rounded border border-surface-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setScopeFilter('ALL')}
                  className={`px-2 py-1 text-[11px] ${scopeFilter === 'ALL' ? 'bg-zinc-700 text-white' : 'bg-surface-subtle text-zinc-400 hover:text-white'}`}
                >
                  All Scope
                </button>
                <button
                  type="button"
                  onClick={() => setScopeFilter('DIRECT')}
                  className={`px-2 py-1 text-[11px] border-l border-surface-border ${scopeFilter === 'DIRECT' ? 'bg-brand-600 text-white' : 'bg-surface-subtle text-zinc-400 hover:text-white'}`}
                >
                  Direct Only
                </button>
                <button
                  type="button"
                  onClick={() => setScopeFilter('TRANSITIVE')}
                  className={`px-2 py-1 text-[11px] border-l border-surface-border ${scopeFilter === 'TRANSITIVE' ? 'bg-blue-600 text-white' : 'bg-surface-subtle text-zinc-400 hover:text-white'}`}
                >
                  Transitive Only
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Search node or file..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-surface-subtle border border-surface-border text-zinc-200 rounded text-xs focus:outline-none focus:border-brand-500 w-48"
                />
              </div>

              <div className="flex items-center border border-surface-border rounded bg-surface-subtle">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
                  className="p-1 hover:text-white text-zinc-400"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-[10px] text-zinc-400">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
                  className="p-1 hover:text-white text-zinc-400"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="p-1 hover:text-white text-zinc-400 border-l border-surface-border"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {!result ? (
            <div className="p-16 rounded-xl border border-dashed border-surface-border text-center bg-surface/30 space-y-3">
              <Network className="w-10 h-10 text-zinc-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">
                  Run an impact analysis to build the quality impact graph.
                </h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  ReleaseGuard traverses AST import boundaries, reverse dependency consumers, OpenAPI contract drift, and database queries to map the complete blast radius.
                </p>
              </div>
              <div>
                <button
                  id="empty-run-impact-btn"
                  onClick={handleRunImpactAnalysis}
                  disabled={loading}
                  type="button"
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Impact Analysis</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Graph Visual Canvas */}
              <div className="lg:col-span-2 p-4 rounded-xl bg-surface border border-surface-border overflow-hidden">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-border text-xs">
                  <div className="flex items-center gap-2 font-mono text-zinc-400">
                    <span>Showing {filteredNodes.length} of {nodes.length} nodes</span>
                    <span>•</span>
                    <span>{edges.length} edges</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-brand-500"></span> Direct Change (Depth 0)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> Transitive Impact
                    </span>
                  </div>
                </div>

                <div
                  className="space-y-6 overflow-x-auto pb-4 transition-transform origin-top-left"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  {sortedDepths.map((depth) => {
                    const depthNodes = nodesByDepth[depth] || [];
                    const isDirect = depth === 0;

                    return (
                      <div key={depth} className="relative pl-6 border-l-2 border-surface-border">
                        {/* Depth Level Indicator */}
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-surface-subtle border border-surface-border flex items-center justify-center text-[9px] font-mono text-zinc-400">
                          {depth}
                        </div>
                        <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-2">
                          <span>{isDirect ? 'Direct Changed Components (Depth 0)' : `Transitive Depth ${depth}`}</span>
                          <span className="text-[10px] text-zinc-600">({depthNodes.length} nodes)</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {depthNodes.map((node) => {
                            const isSelected = selectedNodeId === node.id;
                            const nodeEdgesOut = edges.filter((e) => e.source === node.id);

                            return (
                              <div
                                key={node.id}
                                onClick={() => setSelectedNodeId(node.id)}
                                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-zinc-800/90 border-brand-500 shadow-md ring-1 ring-brand-500/50'
                                    : 'bg-surface-subtle/80 hover:bg-surface-hover border-surface-border'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${getNodeTypeBadge(node.type)}`}>
                                    {node.type}
                                  </span>
                                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                                    node.directChanged
                                      ? 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  }`}>
                                    {node.directChanged ? 'Direct' : `Depth ${node.impactDepth}`}
                                  </span>
                                </div>

                                <div className="font-semibold text-xs text-white tracking-tight flex items-center justify-between">
                                  <span>{node.name}</span>
                                  {isSelected && <ChevronRight className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
                                </div>

                                {node.path && (
                                  <div className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">
                                    {node.path}
                                  </div>
                                )}

                                {nodeEdgesOut.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-surface-border/60 flex items-center gap-1 text-[10px] font-mono text-zinc-500">
                                    <span>Affects {nodeEdgesOut.length} targets</span>
                                    <ArrowRight className="w-3 h-3 text-zinc-600" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inspector Panel */}
              <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                  <div className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                    Node Inspector
                  </div>
                  {selectedNode && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getNodeTypeBadge(selectedNode.type)}`}>
                      {selectedNode.type}
                    </span>
                  )}
                </div>

                {!selectedNode ? (
                  <div className="p-8 text-center text-zinc-500 text-xs font-mono">
                    Select a node from the canvas to inspect verified relationships and forensic evidence.
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    {/* Node Header */}
                    <div>
                      <h4 className="text-sm font-bold text-white font-mono">{selectedNode.name}</h4>
                      {selectedNode.path && (
                        <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                          {selectedNode.path}
                        </div>
                      )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-2 rounded bg-surface-subtle border border-surface-border">
                        <span className="text-zinc-500 block text-[10px]">Impact Status:</span>
                        <span className="text-white font-semibold">
                          {selectedNode.directChanged ? 'Direct Changed' : 'Transitive Impact'}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-surface-subtle border border-surface-border">
                        <span className="text-zinc-500 block text-[10px]">Impact Depth:</span>
                        <span className="text-white font-semibold">Depth {selectedNode.impactDepth}</span>
                      </div>
                      <div className="p-2 rounded bg-surface-subtle border border-surface-border">
                        <span className="text-zinc-500 block text-[10px]">Confidence:</span>
                        <span className="text-white font-semibold">{(selectedNode.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="p-2 rounded bg-surface-subtle border border-surface-border">
                        <span className="text-zinc-500 block text-[10px]">Evidence Count:</span>
                        <span className="text-white font-semibold">{selectedNode.evidence?.length || 0} items</span>
                      </div>
                    </div>

                    {/* Forensic Evidence Items */}
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                        Forensic Evidence ({selectedNode.evidence?.length || 0})
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {selectedNode.evidence?.length === 0 ? (
                          <div className="text-[11px] text-zinc-500 font-mono italic">No direct AST snippet attached.</div>
                        ) : (
                          selectedNode.evidence?.map((ev, i) => (
                            <div key={i} className="p-2.5 rounded bg-surface-subtle border border-surface-border space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="text-brand-400 font-semibold">[{ev.sourceType}]</span>
                                {ev.lineStart && (
                                  <span className="text-zinc-500">L{ev.lineStart}{ev.lineEnd ? `-L${ev.lineEnd}` : ''}</span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-300">{ev.description}</p>
                              {ev.snippet && (
                                <pre className="p-1.5 rounded bg-black/40 text-[10px] font-mono text-zinc-300 overflow-x-auto border border-surface-border/50">
                                  {ev.snippet}
                                </pre>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Connected Relationships */}
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                        Graph Relationships
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-[11px] font-mono">
                        {incomingEdges.map((edge) => (
                          <div key={edge.id} className="p-2 rounded bg-surface-subtle border border-surface-border flex items-center justify-between">
                            <div className="truncate">
                              <span className="text-zinc-500">From: </span>
                              <span className="text-white font-semibold">{edge.source}</span>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-brand-300 border border-zinc-700">
                              {edge.type}
                            </span>
                          </div>
                        ))}
                        {outgoingEdges.map((edge) => (
                          <div key={edge.id} className="p-2 rounded bg-surface-subtle border border-surface-border flex items-center justify-between">
                            <div className="truncate">
                              <span className="text-zinc-500">To: </span>
                              <span className="text-white font-semibold">{edge.target}</span>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-blue-300 border border-zinc-700">
                              {edge.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: API Contract Drift */}
      {activeTab === 'api' && (
        <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">OpenAPI 3.x Contract Drift Analysis</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Detects endpoint removals, HTTP method updates, required property additions, and breaking schema changes.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Total Endpoints Analyzed: {result?.affectedApis.length || 0}
            </span>
          </div>

          {!result || result.affectedApis.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs font-mono border border-dashed border-surface-border rounded-lg">
              No API contract changes detected in the current snapshot comparison.
            </div>
          ) : (
            <div className="space-y-3">
              {result.affectedApis.map((api, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-surface-subtle border border-surface-border space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-zinc-800 text-white border border-zinc-700">
                        {api.method}
                      </span>
                      <span className="text-xs font-mono text-white font-semibold">
                        {api.path}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getContractBadge(api.changeType)}`}>
                      {api.changeType}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300">
                    {api.details}
                  </p>

                  {api.affectedComponents?.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 pt-1">
                      <span className="text-zinc-500">Associated Components:</span>
                      {api.affectedComponents.map((comp) => (
                        <span key={comp} className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {comp}
                        </span>
                      ))}
                    </div>
                  )}

                  {api.evidence && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-surface-border/60">
                      {api.evidence.currentSpec && (
                        <div className="text-[10px] font-mono">
                          <span className="text-zinc-500 block mb-1">Current Spec Evidence:</span>
                          <pre className="p-2 rounded bg-black/40 text-emerald-300 overflow-x-auto border border-surface-border/40">
                            {api.evidence.currentSpec}
                          </pre>
                        </div>
                      )}
                      {api.evidence.previousSpec && (
                        <div className="text-[10px] font-mono">
                          <span className="text-zinc-500 block mb-1">Previous Spec Evidence:</span>
                          <pre className="p-2 rounded bg-black/40 text-red-300 overflow-x-auto border border-surface-border/40">
                            {api.evidence.previousSpec}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Database Blast-Radius */}
      {activeTab === 'db' && (
        <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Database Entities & Query Consumers</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tracks modified migrations, tables, columns, and downstream SQL queries embedded in repository services and repositories.
            </p>
          </div>

          {!result || result.affectedDatabase.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs font-mono border border-dashed border-surface-border rounded-lg">
              No database migration or schema impacts detected.
            </div>
          ) : (
            <div className="space-y-3">
              {result.affectedDatabase.map((db, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-surface-subtle border border-surface-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {db.entityType}
                      </span>
                      <span className="text-xs font-mono text-white font-bold">
                        {db.name}
                      </span>
                      {db.tableName && (
                        <span className="text-[11px] font-mono text-zinc-500">
                          (in table: {db.tableName})
                        </span>
                      )}
                    </div>
                    {db.changeType && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {db.changeType}
                      </span>
                    )}
                  </div>

                  {db.consumers?.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
                        Repository Code Consumers:
                      </span>
                      {db.consumers.map((consumer, cIdx) => (
                        <div key={cIdx} className="p-2.5 rounded bg-surface border border-surface-border text-xs font-mono flex items-center justify-between">
                          <div>
                            <span className="text-white font-semibold">{consumer.component}</span>
                            <span className="text-zinc-500 ml-2">({consumer.filePath}{consumer.line ? `:${consumer.line}` : ''})</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {consumer.operation}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Test Impact Matrix */}
      {activeTab === 'tests' && (
        <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Targeted Regression Test Matrix</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Prioritizes regression test execution based on verified import paths and AST relationships.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Candidate Tests: {result?.affectedTests.length || 0}
            </span>
          </div>

          {!result || result.affectedTests.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs font-mono border border-dashed border-surface-border rounded-lg">
              No candidate tests identified for this change.
            </div>
          ) : (
            <div className="space-y-2">
              {result.affectedTests.map((test, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-[10px] font-mono font-bold">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-mono text-white font-semibold">
                        {test.testFile}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500">
                        Targets: <span className="text-zinc-300">{test.targetComponent || 'Direct module'}</span> • Depth {test.impactDepth}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      test.relationship === 'VERIFIED_IMPORT'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {test.relationship === 'VERIFIED_IMPORT' ? 'Verified Import' : 'Heuristic Candidate'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {test.testType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Uncertainty / Unknowns */}
      {activeTab === 'unknowns' && (
        <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Uncertainty & Unknown Analysis</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Explicitly reports unresolvable dynamic imports, runtime reflections, or ambiguous relationships instead of hallucinating.
            </p>
          </div>

          {!result || result.unknowns.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs font-mono border border-surface-border rounded-lg bg-emerald-500/5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              All dependency references and AST symbols were statically resolved without unknown areas.
            </div>
          ) : (
            <div className="space-y-2">
              {result.unknowns.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-surface-subtle border border-yellow-500/20 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <div className="font-semibold text-white font-mono">{item.area}</div>
                    <div className="text-zinc-400">{item.description}</div>
                    {item.file && <div className="text-[10px] font-mono text-zinc-500">{item.file}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Raw Graph JSON */}
      {activeTab === 'raw' && (
        <div className="p-4 rounded-xl bg-surface border border-surface-border">
          <pre className="p-4 rounded-lg bg-black/50 text-xs font-mono text-zinc-300 overflow-x-auto max-h-[600px] border border-surface-border">
            {JSON.stringify(result || DEFAULT_IMPACT_PAYLOAD, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

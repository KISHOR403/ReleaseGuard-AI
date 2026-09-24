'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Globe,
  Beaker,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  Code2,
} from 'lucide-react';
import type {
  ChangeAnalysisResult,
  ChangedFile,
} from '@releaseguard/change-intelligence';

const PAYMENT_FIXTURE: {
  repository: string;
  baseBranch: string;
  targetBranch: string;
  commitSha: string;
  pullRequestNumber: number;
  changedFiles: ChangedFile[];
} = {
  repository: 'demo-ecommerce',
  baseBranch: 'main',
  targetBranch: 'feature/payment-v2-integration',
  commitSha: 'f4b1c89012a3',
  pullRequestNumber: 42,
  changedFiles: [
    {
      path: 'src/payment/controller.ts',
      status: 'modified',
      additions: 28,
      deletions: 4,
      patch: `@@ -10,4 +10,28 @@
 import { Body, Controller, Get, Param, Post } from '@nestjs/common';
 import { PaymentService } from './service';
 
-@Controller('payment')
+@Controller('/api/v1/payments')
 export class PaymentController {
   constructor(private readonly paymentService: PaymentService) {}
+
+  @Post('charge')
+  async createCharge(@Body() payload: { amount: number; currency: string; token: string }) {
+    return this.paymentService.processCharge(payload.amount, payload.currency, payload.token);
+  }
+
+  @Get('status/:transactionId')
+  async getStatus(@Param('transactionId') transactionId: string) {
+    return this.paymentService.getTransactionStatus(transactionId);
+  }
 }`,
    },
    {
      path: 'src/payment/service.ts',
      status: 'modified',
      additions: 45,
      deletions: 12,
      patch: `@@ -1,15 +1,48 @@
 import { Injectable, Logger } from '@nestjs/common';
+import Stripe from 'stripe';
 
 @Injectable()
 export class PaymentService {
   private readonly logger = new Logger(PaymentService.name);
+  private readonly stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });
 
-  async processCharge(amount: number) {
-    return { success: true };
+  async processCharge(amount: number, currency: string, sourceToken: string) {
+    this.logger.log(\`Initiating charge for amount \${amount} \${currency}\`);
+    if (amount <= 0) {
+      throw new Error('Invalid payment amount');
+    }
+    const idempotencyKey = \`req_\${Date.now()}_\${Math.random().toString(36).substring(7)}\`;
+    const charge = await this.stripe.charges.create({
+      amount,
+      currency,
+      source: sourceToken,
+    }, { idempotencyKey });
+    return { transactionId: charge.id, status: charge.status };
+  }
+
+  async getTransactionStatus(transactionId: string) {
+    return this.stripe.charges.retrieve(transactionId);
   }
 }`,
    },
    {
      path: 'src/payment/service.test.ts',
      status: 'modified',
      additions: 35,
      deletions: 2,
      patch: `@@ -5,2 +5,35 @@
   it('should process payment charges successfully', async () => {
-    expect(true).toBe(true);
+    const service = new PaymentService();
+    const result = await service.processCharge(1000, 'usd', 'tok_visa');
+    expect(result.status).toBe('succeeded');
+  });
+
+  it('should reject non-positive charge amounts', async () => {
+    const service = new PaymentService();
+    await expect(service.processCharge(-50, 'usd', 'tok_visa')).rejects.toThrow('Invalid payment amount');
   });`,
    },
  ],
};

export default function AnalysisPage() {
  const [repository, setRepository] = useState(PAYMENT_FIXTURE.repository);
  const [baseBranch, setBaseBranch] = useState(PAYMENT_FIXTURE.baseBranch);
  const [targetBranch, setTargetBranch] = useState(PAYMENT_FIXTURE.targetBranch);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [changedFiles, setChangedFiles] = useState<ChangedFile[]>(PAYMENT_FIXTURE.changedFiles);

  const [loading, setLoading] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [result, setResult] = useState<ChangeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFixture = () => {
    setRepository(PAYMENT_FIXTURE.repository);
    setBaseBranch(PAYMENT_FIXTURE.baseBranch);
    setTargetBranch(PAYMENT_FIXTURE.targetBranch);
    setChangedFiles(PAYMENT_FIXTURE.changedFiles);
    setActiveFileIndex(0);
    setError(null);
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setAnalysisId(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      const response = await fetch(`${apiUrl}/analysis/change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repository,
          baseBranch,
          targetBranch,
          changedFiles,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Analysis failed');
      }

      setAnalysisId(data.analysisId);
      if (data.status === 'COMPLETED' && data.result) {
        setResult(data.result);
      } else {
        throw new Error(data.error || 'Analysis execution failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const getImpactBadgeClass = (impact: string) => {
    switch (impact) {
      case 'CRITICAL':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <section className="p-6 rounded-xl bg-surface border border-surface-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Change Intelligence
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-zinc-400 bg-surface-subtle border border-surface-border">
                Provider-Independent
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Change Intelligence Analyzer
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Extracts deterministic code boundaries, detects APIs & dependencies, and performs AI reasoning to classify risk indicators and candidate tests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="load-fixture-btn"
              onClick={loadFixture}
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-subtle hover:bg-surface-hover text-zinc-300 text-xs font-mono border border-surface-border transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Payment Fixture</span>
            </button>

            <button
              id="analyze-change-btn"
              onClick={handleRunAnalysis}
              disabled={loading}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition-colors"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Change Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Input Configuration Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Repository Metadata */}
        <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
            <Code2 className="w-4 h-4 text-brand-400" />
            Repository Context
          </h2>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Repository Name</label>
              <input
                id="input-repository"
                type="text"
                value={repository}
                onChange={(e) => setRepository(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-subtle border border-surface-border text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Base Branch</label>
                <input
                  id="input-base-branch"
                  type="text"
                  value={baseBranch}
                  onChange={(e) => setBaseBranch(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle border border-surface-border text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Target Branch</label>
                <input
                  id="input-target-branch"
                  type="text"
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-subtle border border-surface-border text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">
                Changed Files ({changedFiles.length})
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {changedFiles.map((file, idx) => (
                  <button
                    key={file.path}
                    onClick={() => setActiveFileIndex(idx)}
                    type="button"
                    className={`w-full text-left p-2 rounded text-[11px] flex items-center justify-between transition-colors ${
                      idx === activeFileIndex
                        ? 'bg-zinc-800 text-white border border-zinc-700'
                        : 'bg-surface-subtle text-zinc-400 hover:text-zinc-200 border border-transparent'
                    }`}
                  >
                    <span className="truncate">{file.path}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      +{file.additions}/-{file.deletions}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Patch / Diff Viewer */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-surface border border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              Diff Patch: {changedFiles[activeFileIndex]?.path}
            </h2>
            <span className="text-[10px] font-mono text-zinc-400">Unified Diff format</span>
          </div>

          <textarea
            id="input-patch"
            rows={10}
            value={changedFiles[activeFileIndex]?.patch || ''}
            onChange={(e) => {
              const updated = [...changedFiles];
              updated[activeFileIndex].patch = e.target.value;
              setChangedFiles(updated);
            }}
            className="w-full p-3 rounded-lg bg-[#0d0f15] border border-surface-border font-mono text-[11px] text-zinc-300 leading-relaxed focus:outline-none focus:ring-1 focus:ring-brand-500 resize-y"
            placeholder="Unified diff / patch text..."
          />
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-red-200">Analysis Request Failed</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Structured Analysis Results View */}
      {result && (
        <section className="space-y-6 pt-4 border-t border-surface-border">
          {/* Top Result Banner */}
          <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-400">Change Type:</span>
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  {result.changeType}
                </span>
                <span className="text-zinc-600 font-mono">|</span>
                <span className="text-xs font-mono text-zinc-400">Confidence:</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>

              {analysisId && (
                <div className="text-[11px] font-mono text-zinc-400">
                  Analysis ID: <span className="text-zinc-300">{analysisId}</span>
                </div>
              )}
            </div>

            {/* Change Summary */}
            <div>
              <h2 className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-semibold mb-1.5">
                Change Summary
              </h2>
              <p className="text-sm text-zinc-200 leading-relaxed font-sans">
                {result.summary}
              </p>
            </div>
          </div>

          {/* Changed Areas & Affected Components */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Changed Areas */}
            <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-4">
              <h2 className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Changed Areas
              </h2>

              <div className="space-y-2">
                {result.changedAreas.map((area, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-between font-mono text-xs"
                  >
                    <div>
                      <span className="text-zinc-200 font-semibold capitalize">{area.name}</span>
                      <span className="text-zinc-400 text-[11px] ml-2">({area.type})</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getImpactBadgeClass(
                        area.impact
                      )}`}
                    >
                      {area.impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Affected APIs */}
            <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-4">
              <h2 className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Affected APIs
              </h2>

              <div className="space-y-2">
                {result.affectedApis.length === 0 ? (
                  <div className="p-3 rounded-lg bg-surface-subtle text-xs text-zinc-400 font-mono">
                    No public API route modifications detected in this change.
                  </div>
                ) : (
                  result.affectedApis.map((api, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-surface-subtle border border-surface-border font-mono text-xs space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {api.method}
                        </span>
                        <span className="text-zinc-200 font-medium">{api.path}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                        <span>{api.sourceFile}</span>
                        <span>{Math.round(api.confidence * 100)}% match</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Risk Indicators (Explainable AI with concrete evidence) */}
          <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-4">
            <h2 className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Risk Indicators & Traceable Evidence
            </h2>

            <div className="space-y-3 font-mono text-xs">
              {result.riskIndicators.map((risk, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-surface-subtle border border-surface-border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {risk.type}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Confidence: {Math.round(risk.confidence * 100)}%
                    </span>
                  </div>
                  <div className="text-zinc-200 font-sans text-xs">
                    {risk.description}
                  </div>
                  <div className="pt-2 border-t border-surface-border/60">
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">
                      Evidence Trace:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {risk.evidence.map((ev, eIdx) => (
                        <span
                          key={eIdx}
                          className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] border border-zinc-700"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Implications & Candidate Tests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-4">
              <h2 className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
                <Beaker className="w-4 h-4 text-emerald-400" />
                Test Implications (Candidate Tests)
              </h2>

              <div className="space-y-3 font-mono text-xs">
                {result.testImplications.map((test, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-surface-subtle border border-surface-border space-y-2"
                  >
                    <div className="text-zinc-300 font-semibold flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{test.changedFile}</span>
                    </div>

                    <div className="text-[11px] text-zinc-400 space-y-1">
                      <div className="text-[10px] text-zinc-400 uppercase">
                        Candidate Regression Tests:
                      </div>
                      {test.candidateTests.map((cTest, cIdx) => (
                        <div key={cIdx} className="text-emerald-400 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-emerald-500" />
                          <span>{cTest}</span>
                        </div>
                      ))}
                    </div>

                    {test.recommendation && (
                      <div className="text-[11px] text-zinc-400 font-sans italic border-t border-surface-border/40 pt-1">
                        {test.recommendation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Unknowns & Incomplete Areas */}
            <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-4">
              <h2 className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-zinc-400" />
                Unknowns & Ambiguities
              </h2>

              <div className="space-y-2">
                {result.unknowns.length === 0 ? (
                  <div className="p-3 rounded-lg bg-surface-subtle text-xs text-zinc-400 font-mono">
                    No unresolved ambiguities detected. All changes classified with high confidence.
                  </div>
                ) : (
                  result.unknowns.map((unknown, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-surface-subtle border border-surface-border font-mono text-xs text-zinc-300 flex items-start gap-2"
                    >
                      <span className="text-amber-400">•</span>
                      <span>{unknown}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

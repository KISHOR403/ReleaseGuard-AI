'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Network, ArrowRight } from 'lucide-react';

export default function RiskAnalysisPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
              Coming next • Milestone 4
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Release Risk Assessment
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Quantitative multi-factor risk heuristics, blast radius severity, and release gate decision policies.
          </p>
        </div>

        <Link
          href="/impact"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-surface-subtle hover:bg-surface-hover text-zinc-300 text-xs font-medium border border-surface-border transition-colors self-start sm:self-auto"
        >
          <Network className="w-3.5 h-3.5 text-zinc-400" />
          <span>Explore Impact Graph</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
        </Link>
      </div>

      {/* Honest Architectural Context */}
      <div className="p-8 rounded-lg bg-surface border border-surface-border space-y-6">
        <div className="max-w-2xl space-y-2">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            Multi-Factor Risk Scoring Engine (Milestone 4)
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            ReleaseGuard evaluates code churn, blast radius depth from the Quality Impact Graph, critical path business logic (payments, auth, checkout), and historical defect volatility to calculate an explainable 0–100 release risk score.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-4 rounded-md bg-surface-subtle border border-surface-border space-y-1.5">
            <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Preceding Step 1</span>
            <span className="text-white font-semibold">Change Intelligence</span>
            <p className="text-[11px] text-zinc-400 font-sans">
              Identifies deterministic AST boundaries, changed functions, and API routes.
            </p>
            <span className="inline-block text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              OPERATIONAL
            </span>
          </div>

          <div className="p-4 rounded-md bg-surface-subtle border border-surface-border space-y-1.5">
            <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Preceding Step 2</span>
            <span className="text-white font-semibold">Impact Analysis</span>
            <p className="text-[11px] text-zinc-400 font-sans">
              Traverses reverse dependencies, contract drift, and database query consumers.
            </p>
            <span className="inline-block text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              OPERATIONAL
            </span>
          </div>

          <div className="p-4 rounded-md bg-surface-subtle border border-surface-border space-y-1.5 opacity-80">
            <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Upcoming Step 3</span>
            <span className="text-amber-300 font-semibold">Risk Engine</span>
            <p className="text-[11px] text-zinc-400 font-sans">
              Synthesizes code churn and blast radius metrics into release decision policies.
            </p>
            <span className="inline-block text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              COMING NEXT
            </span>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <Link
            href="/impact"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow transition-colors"
          >
            <span>View Quality Impact Graph</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

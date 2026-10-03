'use client';

import React from 'react';
import Link from 'next/link';
import { ListFilter, Network, ArrowRight } from 'lucide-react';

export default function TestSelectionPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
              Planned • Milestone 5
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Intelligent Test Selection
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Targeted regression test subsetting based on AST impact boundaries, minimizing CI pipeline execution times.
          </p>
        </div>

        <Link
          href="/impact"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-surface-subtle hover:bg-surface-hover text-zinc-300 text-xs font-medium border border-surface-border transition-colors self-start sm:self-auto"
        >
          <Network className="w-3.5 h-3.5 text-zinc-400" />
          <span>View Impact Test Matrix</span>
        </Link>
      </div>

      {/* Overview Card */}
      <div className="p-8 rounded-lg bg-surface border border-surface-border space-y-5">
        <div className="max-w-2xl space-y-2">
          <div className="w-10 h-10 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-center text-zinc-400 mb-3">
            <ListFilter className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            Targeted Regression Subsets (Planned)
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Rather than executing full monolithic test suites on every pull request, the Test Selection Agent selects only tests that directly import or transitively touch modified components, database tables, or modified API endpoints.
          </p>
        </div>

        <div className="p-4 rounded-md bg-surface-subtle border border-surface-border font-mono text-xs text-zinc-400 max-w-xl">
          <div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Current Capability</div>
          <div>Candidate test targets are already mapped via the Quality Impact Graph.</div>
          <div className="mt-2 text-brand-400">
            Visit the Impact Graph workbench to inspect candidate regression tests detected for the current snapshot.
          </div>
        </div>

        <div className="pt-2">
          <Link
            href="/impact"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow transition-colors"
          >
            <span>Inspect Candidate Tests in Impact Graph</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

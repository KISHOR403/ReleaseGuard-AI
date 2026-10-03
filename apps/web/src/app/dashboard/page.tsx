'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Play,
  ArrowRight,
  GitPullRequest,
  CheckCircle2,
  FolderGit2,
  Server,
  Layers,
  Sparkles,
  Network,
  ShieldAlert,
  ListFilter,
  Cpu,
  Info,
} from 'lucide-react';
import type { HealthStatus } from '@releaseguard/shared';

interface StoredAnalysis {
  id: string;
  changeSummary: string;
  repository: string;
  filesCount: number;
  impact: string;
  createdAt: string;
  status: 'COMPLETED' | 'FAILED';
  hasBreakingApi?: boolean;
}

export default function DashboardPage() {
  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [hasConnectedRepo, setHasConnectedRepo] = useState<boolean>(false);

  useEffect(() => {
    // Check API health
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    fetch(`${apiUrl}/health`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setHealth(data))
      .catch(() => setHealth(null));

    // Check localStorage for any real analyses run by user during session
    try {
      const stored = localStorage.getItem('rg_recent_analyses');
      if (stored) {
        const parsed = JSON.parse(stored) as StoredAnalysis[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAnalyses(parsed);
          setHasConnectedRepo(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Compute needs attention items from real data only
  const attentionItems: { type: string; message: string; link: string }[] = [];
  analyses.forEach((a) => {
    if (a.impact === 'HIGH' || a.impact === 'CRITICAL') {
      attentionItems.push({
        type: 'High-Impact Change',
        message: `${a.repository}: High-impact modification in ${a.changeSummary}`,
        link: '/analysis',
      });
    }
    if (a.hasBreakingApi) {
      attentionItems.push({
        type: 'API Contract Drift',
        message: `${a.repository}: Breaking API change detected in contract comparison`,
        link: '/impact',
      });
    }
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Core Product Positioning */}
      <section className="p-6 rounded-lg bg-surface border border-surface-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20">
                Quality Engineering Control Center
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-surface-subtle border border-surface-border">
                Foundation Milestone
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Understand change. Map impact. Test what matters.
            </h1>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              ReleaseGuard helps engineering teams understand the downstream impact of software changes and focus regression testing where it matters.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/analysis"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Change Analysis</span>
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-surface-subtle hover:bg-surface-hover text-zinc-300 text-xs font-medium border border-surface-border transition-colors"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Connect Repository</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Core QA Workflow Pipeline */}
      <section className="p-4 rounded-lg bg-surface border border-surface-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            Quality Engineering Workflow
          </h2>
          <span className="text-[10px] font-mono text-zinc-500">Autonomous QA Chain</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Stage 1: Change Intelligence */}
          <Link
            href="/analysis"
            className="p-3 rounded-md bg-surface-subtle border border-surface-border hover:border-brand-500/50 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-zinc-500">01 / CHANGE</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                READY
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                Change Intelligence
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 leading-snug">
                AST boundaries & diff categorization
              </p>
            </div>
          </Link>

          {/* Stage 2: Impact Analysis */}
          <Link
            href="/impact"
            className="p-3 rounded-md bg-surface-subtle border border-surface-border hover:border-brand-500/50 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-zinc-500">02 / IMPACT</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                READY
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-blue-400" />
                Impact Graph
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 leading-snug">
                Reverse blast radius & API/DB mapping
              </p>
            </div>
          </Link>

          {/* Stage 3: Risk Assessment */}
          <div className="p-3 rounded-md bg-surface-subtle/50 border border-surface-border flex flex-col justify-between opacity-80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-zinc-500">03 / RISK</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                COMING NEXT
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
                Risk Assessment
              </div>
              <p className="text-[10px] text-zinc-500 mt-1 leading-snug">
                Multi-factor risk score & release gate
              </p>
            </div>
          </div>

          {/* Stage 4: Test Selection */}
          <div className="p-3 rounded-md bg-surface-subtle/50 border border-surface-border flex flex-col justify-between opacity-70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-zinc-500">04 / TESTS</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700 font-semibold">
                PLANNED
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <ListFilter className="w-3.5 h-3.5 text-zinc-500" />
                Test Selection
              </div>
              <p className="text-[10px] text-zinc-500 mt-1 leading-snug">
                Subsetting targeted regression suites
              </p>
            </div>
          </div>

          {/* Stage 5: Test Execution */}
          <div className="p-3 rounded-md bg-surface-subtle/50 border border-surface-border flex flex-col justify-between opacity-70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-zinc-500">05 / RESULT</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700 font-semibold">
                PLANNED
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-zinc-500" />
                Test Execution
              </div>
              <p className="text-[10px] text-zinc-500 mt-1 leading-snug">
                Sandboxed test runner & forensic trace
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Primary Quality Overview Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            Quality Overview
          </h2>
          <span className="text-[10px] font-mono text-zinc-500">Active Repositories</span>
        </div>

        {hasConnectedRepo ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-lg bg-surface border border-surface-border space-y-1">
              <div className="text-[11px] font-mono text-zinc-400 uppercase">Open PRs</div>
              <div className="text-2xl font-bold font-mono text-white">0</div>
              <div className="text-[10px] text-zinc-500 font-mono">GitHub App webhook ready</div>
            </div>
            <div className="p-4 rounded-lg bg-surface border border-surface-border space-y-1">
              <div className="text-[11px] font-mono text-zinc-400 uppercase">High-Impact Changes</div>
              <div className="text-2xl font-bold font-mono text-amber-400">
                {analyses.filter((a) => a.impact === 'HIGH' || a.impact === 'CRITICAL').length}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">From recorded analyses</div>
            </div>
            <div className="p-4 rounded-lg bg-surface border border-surface-border space-y-1">
              <div className="text-[11px] font-mono text-zinc-400 uppercase">Affected Services</div>
              <div className="text-2xl font-bold font-mono text-blue-400">
                {analyses.length > 0 ? '1' : '0'}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">demo-ecommerce snapshot</div>
            </div>
            <div className="p-4 rounded-lg bg-surface border border-surface-border space-y-1">
              <div className="text-[11px] font-mono text-zinc-400 uppercase">Tests Selected</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {analyses.length > 0 ? '2' : '0'}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">Targeted candidates</div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-lg bg-surface border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">Connect your first repository</h3>
              <p className="text-xs text-zinc-400 max-w-xl">
                ReleaseGuard analyzes code changes, maps downstream impact, and prepares targeted regression testing.
              </p>
            </div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors shrink-0"
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Connect Repository</span>
            </Link>
          </div>
        )}
      </section>

      {/* 4. Split Layout: Needs Attention & Recent Pull Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Needs Attention */}
        <section className="p-4 rounded-lg bg-surface border border-surface-border space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-surface-border">
            <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-zinc-400" />
              Needs Attention
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">
              {attentionItems.length} active
            </span>
          </div>

          {attentionItems.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-zinc-400 space-y-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5 opacity-80" />
              <div className="text-zinc-300 font-medium">No actions require your attention.</div>
              <div className="text-[11px] text-zinc-500">All evaluated changes are within safe boundaries.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {attentionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-md bg-surface-subtle border border-surface-border flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase font-semibold text-amber-400 block">
                      {item.type}
                    </span>
                    <span className="text-zinc-200">{item.message}</span>
                  </div>
                  <Link
                    href={item.link}
                    className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Pull Requests */}
        <section className="p-4 rounded-lg bg-surface border border-surface-border space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-surface-border">
            <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <GitPullRequest className="w-3.5 h-3.5 text-zinc-400" />
              Recent Pull Requests
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">GitHub App</span>
          </div>

          <div className="p-6 text-center text-xs font-mono text-zinc-400 space-y-2">
            <div className="text-zinc-300 font-medium">Connect a repository to monitor pull requests.</div>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              Automated webhook triggers analyze incoming PR commits directly from your Git provider.
            </p>
            <div className="pt-2">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-subtle hover:bg-surface-hover text-zinc-200 text-xs font-medium border border-surface-border transition-colors"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Connect Repository</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* 5. Recent Analyses Section */}
      <section className="p-4 rounded-lg bg-surface border border-surface-border space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-surface-border">
          <div>
            <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
              Recent Analyses
            </h3>
            <p className="text-[11px] text-zinc-400">
              Evaluations executed via Change Intelligence and Impact Analysis.
            </p>
          </div>
          <Link
            href="/analysis"
            className="text-xs font-mono text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <span>Open Workbench</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {analyses.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-zinc-400 space-y-3">
            <div>No analyses yet.</div>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              Run a change analysis or blast-radius evaluation on a repository snapshot to see records here.
            </p>
            <Link
              href="/analysis"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run Change Analysis</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-surface-border text-zinc-500 text-[10px] uppercase">
                  <th className="pb-2">Change</th>
                  <th className="pb-2">Repository</th>
                  <th className="pb-2">Files</th>
                  <th className="pb-2">Impact</th>
                  <th className="pb-2">Created</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {analyses.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-2.5 font-medium text-white truncate max-w-xs">
                      {a.changeSummary}
                    </td>
                    <td className="py-2.5 text-zinc-400">{a.repository}</td>
                    <td className="py-2.5 text-zinc-300">{a.filesCount} files</td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {a.impact}
                      </span>
                    </td>
                    <td className="py-2.5 text-zinc-500 text-[11px]">{a.createdAt}</td>
                    <td className="py-2.5 text-right">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 6. Platform Status Section */}
      <section className="p-4 rounded-lg bg-surface border border-surface-border space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-surface-border">
          <div>
            <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-zinc-400" />
              Platform Status
            </h3>
            <p className="text-[11px] text-zinc-400">
              Operational readiness of ReleaseGuard AI core services and future milestones.
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">Direct Telemetry</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          {/* API */}
          <div className="p-2.5 rounded-md bg-surface-subtle border border-surface-border flex items-center justify-between">
            <span className="text-zinc-300">API Gateway</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                health?.status === 'ok'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              {health?.status === 'ok' ? 'READY' : 'STANDBY'}
            </span>
          </div>

          {/* Database */}
          <div className="p-2.5 rounded-md bg-surface-subtle border border-surface-border flex items-center justify-between">
            <span className="text-zinc-300">Database</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              CONFIGURED
            </span>
          </div>

          {/* Redis */}
          <div className="p-2.5 rounded-md bg-surface-subtle border border-surface-border flex items-center justify-between">
            <span className="text-zinc-300">Redis Cache</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              CONFIGURED
            </span>
          </div>

          {/* Change Intelligence */}
          <div className="p-2.5 rounded-md bg-surface-subtle border border-surface-border flex items-center justify-between">
            <span className="text-zinc-300">Change Intelligence</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              READY
            </span>
          </div>

          {/* Impact Analysis */}
          <div className="p-2.5 rounded-md bg-surface-subtle border border-surface-border flex items-center justify-between">
            <span className="text-zinc-300">Impact Analysis</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              READY
            </span>
          </div>

          {/* Risk Engine */}
          <div className="p-2.5 rounded-md bg-surface-subtle border border-surface-border flex items-center justify-between opacity-80">
            <span className="text-zinc-400">Risk Engine</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              COMING NEXT
            </span>
          </div>

          {/* Test Selection */}
          <div className="p-2.5 rounded-md bg-surface-subtle border border-surface-border flex items-center justify-between opacity-70">
            <span className="text-zinc-400">Test Selection</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
              PLANNED
            </span>
          </div>

          {/* Test Execution */}
          <div className="p-2.5 rounded-md bg-surface-subtle border border-surface-border flex items-center justify-between opacity-70">
            <span className="text-zinc-400">Test Execution</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
              PLANNED
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

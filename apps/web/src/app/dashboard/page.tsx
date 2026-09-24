import React from 'react';
import Link from 'next/link';
import {
  GitPullRequest,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Title & Product Vision Banner */}
      <section className="p-6 rounded-xl bg-surface border border-surface-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20">
                Core Platform
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-zinc-400 bg-surface-subtle border border-surface-border">
                Foundation v0.1.0
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              ReleaseGuard AI
            </h1>
            <p className="text-sm text-zinc-400 mt-1 font-normal max-w-2xl">
              AI-powered release risk and autonomous regression platform.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
            >
              <span>View Projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics / Telemetry Placeholders (Real empty states, no fake numbers) */}
      <section>
        <h2 className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-semibold mb-4">
          Monitored Pipelines
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1 */}
          <div className="p-5 rounded-lg bg-surface border border-surface-border space-y-3">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium text-zinc-300">Repositories</span>
              <Database className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-mono font-semibold text-white">0</div>
            <p className="text-[11px] text-zinc-400">
              No repositories connected yet. GitHub App configuration required.
            </p>
          </div>

          {/* Metric 2 */}
          <div className="p-5 rounded-lg bg-surface border border-surface-border space-y-3">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium text-zinc-300">Monitored PRs</span>
              <GitPullRequest className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-mono font-semibold text-white">0</div>
            <p className="text-[11px] text-zinc-400">
              PR ingestion webhook listener ready on backend gateway.
            </p>
          </div>

          {/* Metric 3 */}
          <div className="p-5 rounded-lg bg-surface border border-surface-border space-y-3">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium text-zinc-300">Risk Evaluations</span>
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-sm font-mono text-zinc-400 mt-2 font-medium">Standby</div>
            <p className="text-[11px] text-zinc-400">
              Risk Engine module scheduled for Milestone 3 implementation.
            </p>
          </div>

          {/* Metric 4 */}
          <div className="p-5 rounded-lg bg-surface border border-surface-border space-y-3">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium text-zinc-300">Test Selections</span>
              <Cpu className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-sm font-mono text-zinc-400 mt-2 font-medium">Standby</div>
            <p className="text-[11px] text-zinc-400">
              Intelligent test subsetting engine ready for worker integration.
            </p>
          </div>
        </div>
      </section>

      {/* Platform Architecture & Milestone Verification Status */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Foundation Modules Status */}
        <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-5">
          <div className="border-b border-surface-border pb-3">
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Platform Architecture Status
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Current operational readiness of ReleaseGuard AI subsystems.
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-subtle border border-surface-border">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-zinc-200">Monorepo & Shared Types</span>
              </div>
              <span className="text-[11px] text-emerald-400">Ready</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-subtle border border-surface-border">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-zinc-200">PostgreSQL 16 & Redis 7 (Docker)</span>
              </div>
              <span className="text-[11px] text-emerald-400">Configured</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-subtle border border-surface-border">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-zinc-200">NestJS API Gateway (`apps/api`)</span>
              </div>
              <span className="text-[11px] text-emerald-400">Ready</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-subtle border border-surface-border">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-400">Background Workers (`workers/*`)</span>
              </div>
              <span className="text-[11px] text-zinc-400">Milestone 2</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-subtle border border-surface-border">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-400">8 Autonomous QE Agents (`packages/ai`)</span>
              </div>
              <span className="text-[11px] text-zinc-400">Milestone 3</span>
            </div>
          </div>
        </div>

        {/* Documentation & Specifications */}
        <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-5">
          <div className="border-b border-surface-border pb-3">
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Architecture & Governance
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Specifications outlining the ReleaseGuard AI engineering roadmap.
            </p>
          </div>

          <div className="space-y-3 font-sans text-xs">
            <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200">docs/PRD.md</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  Product Vision
                </span>
              </div>
              <p className="text-zinc-400 text-[11px] mt-1">
                Problem definition, core user profiles, MVP criteria, and long-term release loop.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200">docs/ARCHITECTURE.md</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  System Design
                </span>
              </div>
              <p className="text-zinc-400 text-[11px] mt-1">
                Monorepo topology, Next.js frontend, NestJS gateway, PostgreSQL, Redis, and workers.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200">docs/AGENTS.md</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  AI Agents
                </span>
              </div>
              <p className="text-zinc-400 text-[11px] mt-1">
                Specifications for all 8 autonomous agents from Change Intelligence to Self-Healing.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200">docs/SECURITY.md & API.md</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  Standards
                </span>
              </div>
              <p className="text-zinc-400 text-[11px] mt-1">
                Multi-tenant isolation, zero-secret policy, audit logging, and GET /health contract.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

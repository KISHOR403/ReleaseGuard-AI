import React from 'react';
import { Server, ShieldAlert, Cpu } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-surface-border">
        <h1 className="text-xl font-bold text-white tracking-tight">
          System Settings & Environment
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Review core infrastructure endpoints, local configuration tokens, and security policies.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        {/* Section 1: Core Service Endpoints */}
        <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-surface-border">
            <Server className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-white">
              Local Infrastructure Endpoints
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">PostgreSQL 16</span>
              <div className="text-zinc-200 font-semibold">localhost:5432</div>
              <div className="text-[11px] text-zinc-400">Database: releaseguard</div>
            </div>

            <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">Redis 7</span>
              <div className="text-zinc-200 font-semibold">localhost:6379</div>
              <div className="text-[11px] text-zinc-400">Queue & Pub/Sub broker</div>
            </div>

            <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">NestJS API Gateway</span>
              <div className="text-zinc-200 font-semibold">http://localhost:4000</div>
              <div className="text-[11px] text-zinc-400">Health: GET /health</div>
            </div>

            <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">Next.js Web Console</span>
              <div className="text-zinc-200 font-semibold">http://localhost:3000</div>
              <div className="text-[11px] text-zinc-400">App Router, Tailwind CSS</div>
            </div>
          </div>
        </div>

        {/* Section 2: Security & Isolation Policy */}
        <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-surface-border">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">
              Security Governance
            </h2>
          </div>

          <div className="space-y-3 text-xs text-zinc-400 leading-relaxed font-sans">
            <p>
              ReleaseGuard AI enforces strict secrets hygiene. Production credentials, API tokens, and webhook secrets are exclusively loaded via environment variables and never committed to version control.
            </p>
            <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border font-mono text-[11px] text-zinc-300 space-y-1">
              <div>• Tenant isolation verified at database connection boundary.</div>
              <div>• Worker environments run isolated test execution sandboxes.</div>
              <div>• AI Agent outputs are subject to human approval before gating releases.</div>
            </div>
          </div>
        </div>

        {/* Section 3: Monorepo Package Topology */}
        <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-surface-border">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">
              Monorepo Package Map
            </h2>
          </div>

          <div className="font-mono text-xs space-y-2">
            <div className="flex items-center justify-between p-2 rounded bg-surface-subtle border border-surface-border text-zinc-300">
              <span>packages/shared</span>
              <span className="text-zinc-400 text-[11px]">Universal types (HealthStatus)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-surface-subtle border border-surface-border text-zinc-300">
              <span>packages/database</span>
              <span className="text-zinc-400 text-[11px]">Database client & entities</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-surface-subtle border border-surface-border text-zinc-300">
              <span>packages/ai</span>
              <span className="text-zinc-400 text-[11px]">Agent workflow orchestration</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-surface-subtle border border-surface-border text-zinc-300">
              <span>packages/github</span>
              <span className="text-zinc-400 text-[11px]">Webhook & Octokit integration</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-surface-subtle border border-surface-border text-zinc-300">
              <span>packages/risk-engine</span>
              <span className="text-zinc-400 text-[11px]">Multi-factor scoring algorithms</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-surface-subtle border border-surface-border text-zinc-300">
              <span>packages/test-engine</span>
              <span className="text-zinc-400 text-[11px]">Intelligent test selection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { FolderGit2 } from 'lucide-react';

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
              Not connected
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Platform Integrations
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Git providers, CI/CD runners, and issue tracking connectors.
          </p>
        </div>

        <Link
          href="/projects"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-surface-subtle hover:bg-surface-hover text-zinc-300 text-xs font-medium border border-surface-border transition-colors self-start sm:self-auto"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-zinc-400" />
          <span>Connect Repository</span>
        </Link>
      </div>

      {/* Grid of Connectors with explicit honest statuses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* GitHub */}
        <div className="p-5 rounded-lg bg-surface border border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">GitHub App</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              Not connected
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Ingests pull request webhooks and writes back automated quality checks and blast radius reports.
          </p>
          <Link
            href="/projects"
            className="inline-block text-xs font-mono text-brand-400 hover:text-brand-300"
          >
            Configure in Repositories →
          </Link>
        </div>

        {/* Jira */}
        <div className="p-5 rounded-lg bg-surface border border-surface-border space-y-3 opacity-80">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Jira Software</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              Planned
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Automatically files verified bug reports with forensic HAR evidence and stack traces.
          </p>
          <span className="text-xs font-mono text-zinc-500">Scheduled for Milestone 6</span>
        </div>

        {/* Slack / Webhooks */}
        <div className="p-5 rounded-lg bg-surface border border-surface-border space-y-3 opacity-80">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Slack Notifications</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              Planned
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Sends high-impact release alerts and regression test failure summaries to engineering channels.
          </p>
          <span className="text-xs font-mono text-zinc-500">Scheduled for Milestone 7</span>
        </div>
      </div>
    </div>
  );
}

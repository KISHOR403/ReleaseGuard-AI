'use client';

import React from 'react';
import Link from 'next/link';
import { GitPullRequest, FolderGit2, Play } from 'lucide-react';

export default function PullRequestsPage() {
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
            Monitored Pull Requests
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time feed of pull request commits, automated risk evaluations, and regression triggers.
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

      {/* Honest Empty State */}
      <div className="p-12 rounded-lg bg-surface border border-surface-border flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-center text-zinc-500">
          <GitPullRequest className="w-6 h-6" />
        </div>

        <div className="space-y-1 max-w-md">
          <h2 className="text-sm font-semibold text-white">No Monitored Pull Requests</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Connect a repository so ReleaseGuard can analyze incoming pull request diffs, construct quality impact graphs, and target regression testing.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow transition-colors"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Connect Repository</span>
          </Link>
          <Link
            href="/analysis"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-surface-subtle hover:bg-surface-hover text-zinc-300 text-xs font-medium border border-surface-border transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-zinc-400" />
            <span>Analyze Snapshot Offline</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

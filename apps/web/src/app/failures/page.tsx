'use client';

import React from 'react';
import Link from 'next/link';
import { AlertOctagon, FolderGit2 } from 'lucide-react';

export default function FailuresPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
              Planned • Milestone 6
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Failure Investigation & Evidence
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Automated defect analysis, root cause forensics (HAR, DOM snapshots, videos), and Jira defect generation.
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

      {/* Empty State */}
      <div className="p-12 rounded-lg bg-surface border border-surface-border flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-center text-zinc-500">
          <AlertOctagon className="w-6 h-6" />
        </div>

        <div className="space-y-1 max-w-md">
          <h2 className="text-sm font-semibold text-white">No Test Failures Recorded</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            When regression tests fail in an automated execution run, the Failure Investigation Agent captures diagnostic network traces, console logs, and diff context to triage whether the failure is a product defect or test suite flakiness.
          </p>
        </div>
      </div>
    </div>
  );
}

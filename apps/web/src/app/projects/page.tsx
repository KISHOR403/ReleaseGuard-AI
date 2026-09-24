import React from 'react';
import { FolderGit2, Plus } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Connected Repositories
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage repositories monitored for pull request impact, risk assessment, and regression testing.
          </p>
        </div>
        <button
          id="connect-repo-btn"
          disabled
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-medium border border-zinc-700 cursor-not-allowed opacity-75"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Connect Repository (Milestone 2)</span>
        </button>
      </div>

      {/* Empty State Card */}
      <div className="p-12 rounded-xl bg-surface border border-surface-border flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-zinc-400 mb-4">
          <FolderGit2 className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-white tracking-tight">
          No Monitored Repositories
        </h2>
        <p className="text-xs text-zinc-400 max-w-md mt-1.5 leading-relaxed">
          ReleaseGuard AI connects to your repositories via a GitHub App to inspect pull request diffs, construct dependency graphs, and orchestrate targeted regression runs.
        </p>

        {/* Informative onboarding checklist */}
        <div className="mt-8 max-w-lg w-full text-left p-4 rounded-lg bg-surface-subtle border border-surface-border space-y-3 font-mono text-xs">
          <div className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider font-sans">
            Upcoming Integration Steps (Milestone 2)
          </div>
          <div className="flex items-start gap-2.5 text-zinc-400">
            <span className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-300 shrink-0">1</span>
            <span>Install the ReleaseGuard GitHub App on your organization or repositories.</span>
          </div>
          <div className="flex items-start gap-2.5 text-zinc-400">
            <span className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-300 shrink-0">2</span>
            <span>Configure target branches (`main`, `master`, `release/*`) and test suite paths.</span>
          </div>
          <div className="flex items-start gap-2.5 text-zinc-400">
            <span className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-300 shrink-0">3</span>
            <span>Set up automated PR status checks and minimum confidence release gates.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, Play } from 'lucide-react';

interface ActivityItem {
  id: string;
  changeSummary: string;
  repository: string;
  filesCount: number;
  impact: string;
  createdAt: string;
  status: 'COMPLETED' | 'FAILED';
}

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('rg_recent_analyses');
      if (stored) {
        const parsed = JSON.parse(stored) as ActivityItem[];
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            System Activity Log
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Audit history of AgentRun executions, quality evaluations, and test triggers.
          </p>
        </div>

        <Link
          href="/analysis"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow transition-colors self-start sm:self-auto"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>New Analysis</span>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="p-12 rounded-lg bg-surface border border-surface-border flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-center text-zinc-500">
            <History className="w-6 h-6" />
          </div>

          <div className="space-y-1 max-w-md">
            <h2 className="text-sm font-semibold text-white">No Activity Recorded Yet</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Execute a change analysis or blast-radius calculation to generate traceable AgentRun logs.
            </p>
          </div>

          <Link
            href="/analysis"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Change Analysis</span>
          </Link>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-surface border border-surface-border space-y-3">
          <div className="text-xs font-mono text-zinc-400 font-semibold uppercase">
            Recent AgentRun Events ({items.length})
          </div>

          <div className="divide-y divide-surface-border/60">
            {items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs font-mono">
                <div className="space-y-0.5">
                  <div className="text-white font-medium">{item.changeSummary}</div>
                  <div className="text-[11px] text-zinc-500">
                    Repo: <span className="text-zinc-400">{item.repository}</span> • Files: {item.filesCount} • Run ID: {item.id}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-500">{item.createdAt}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

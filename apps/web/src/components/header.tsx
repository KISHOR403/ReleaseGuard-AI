'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FolderGit2, Terminal } from 'lucide-react';
import type { HealthStatus } from '@releaseguard/shared';

export function Header() {
  const pathname = usePathname();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRepo, setSelectedRepo] = useState<string>('demo-ecommerce');

  const getBreadcrumbTitle = (path: string) => {
    if (path === '/dashboard' || path === '/') return 'Dashboard';
    if (path.startsWith('/pull-requests')) return 'Pull Requests';
    if (path.startsWith('/analysis')) return 'Change Analysis';
    if (path.startsWith('/impact')) return 'Impact Graph';
    if (path.startsWith('/risk')) return 'Risk Analysis';
    if (path.startsWith('/test-selection')) return 'Test Selection';
    if (path.startsWith('/test-runs')) return 'Test Runs';
    if (path.startsWith('/failures')) return 'Failures';
    if (path.startsWith('/projects')) return 'Repositories';
    if (path.startsWith('/integrations')) return 'Integrations';
    if (path.startsWith('/activity')) return 'Activity';
    if (path.startsWith('/settings')) return 'Settings';
    return 'Dashboard';
  };

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    let isMounted = true;

    async function checkHealth() {
      try {
        const res = await fetch(`${apiUrl}/health`, { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as HealthStatus;
          if (isMounted) {
            setHealth(data);
            setLoading(false);
          }
        } else {
          if (isMounted) setLoading(false);
        }
      } catch {
        if (isMounted) setLoading(false);
      }
    }

    void checkHealth();
    const interval = setInterval(() => {
      void checkHealth();
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header
      id="main-header"
      className="h-16 border-b border-surface-border bg-surface/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-10 select-none"
      aria-label="Application Header"
    >
      {/* Left: Breadcrumbs & Section Title */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-zinc-400 font-medium">ReleaseGuard</span>
        <span className="text-zinc-600 font-mono">/</span>
        <h1 className="text-xs font-semibold text-white tracking-tight font-mono">
          {getBreadcrumbTitle(pathname)}
        </h1>
      </div>

      {/* Right Controls: Repository Selector & System Status */}
      <div className="flex items-center gap-3">
        {/* Project / Repository Selector */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-subtle border border-surface-border text-xs font-mono text-zinc-300">
          <FolderGit2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="text-zinc-500 hidden sm:inline">Project:</span>
          <select
            aria-label="Current Project or Repository"
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
          >
            <option value="demo-ecommerce" className="bg-zinc-900 text-white">
              demo-ecommerce (Snapshot)
            </option>
            <option value="" disabled className="bg-zinc-900 text-zinc-500">
              ───────────────
            </option>
            <option value="none" className="bg-zinc-900 text-zinc-400">
              No repository connected
            </option>
          </select>
        </div>

        {/* Backend Health Status Pill */}
        <div
          id="api-health-badge"
          className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-subtle border border-surface-border text-xs font-mono"
        >
          <span className="relative flex h-2 w-2">
            {health?.status === 'ok' ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500"></span>
            )}
          </span>
          <span className="text-zinc-300 text-[11px]">
            {loading
              ? 'Status: Checking...'
              : health?.status === 'ok'
                ? 'Status: API Connected'
                : 'Status: API Standby'}
          </span>
        </div>

        {/* Environment Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-[11px] font-mono text-zinc-400">
          <Terminal className="w-3 h-3 text-zinc-400" />
          <span>Foundation Control Center</span>
        </div>
      </div>
    </header>
  );
}

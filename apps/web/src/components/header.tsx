'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Terminal } from 'lucide-react';
import type { HealthStatus } from '@releaseguard/shared';

export function Header() {
  const pathname = usePathname();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const getPageTitle = (path: string) => {
    if (path.startsWith('/projects')) return 'Projects';
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
      className="h-16 border-b border-surface-border bg-surface/80 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-10"
      aria-label="Application Header"
    >
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-zinc-400">ReleaseGuard</span>
        <span className="text-zinc-600 font-mono">/</span>
        <h1 className="text-sm font-semibold text-white tracking-tight">
          {getPageTitle(pathname)}
        </h1>
      </div>

      {/* Right: API Health Status & Environment pill */}
      <div className="flex items-center gap-4">
        {/* Backend health status pill */}
        <div
          id="api-health-badge"
          className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-subtle border border-surface-border text-xs font-mono"
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
          <span className="text-zinc-400">
            {loading
              ? 'API: Connecting...'
              : health?.status === 'ok'
                ? `API: ${health.service}`
                : 'API: Standby'}
          </span>
        </div>

        {/* Milestone Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-xs font-mono text-zinc-300">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>Foundation Milestone</span>
        </div>
      </div>
    </header>
  );
}

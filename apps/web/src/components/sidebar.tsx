'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderGit2,
  Settings,
  ShieldCheck,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Change Analysis',
    href: '/analysis',
    icon: Sparkles,
  },
  {
    name: 'Projects',
    href: '/projects',
    icon: FolderGit2,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      id="main-sidebar"
      className="w-64 border-r border-surface-border bg-surface flex flex-col justify-between h-screen sticky top-0 select-none z-20"
      aria-label="Application Sidebar"
    >
      {/* Top: Branding and Navigation */}
      <div>
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-surface-border flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group focus:outline-none focus:ring-1 focus:ring-brand-500 rounded-md p-1"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-600/10 border border-brand-500/30 flex items-center justify-center text-brand-500 group-hover:bg-brand-600/20 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                ReleaseGuard
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  AI
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 font-mono">
                Quality Engineering
              </div>
            </div>
          </Link>
        </div>

        {/* Section Label */}
        <div className="px-5 pt-6 pb-2 text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold">
          Platform
        </div>

        {/* Nav list */}
        <nav className="px-3 space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                id={`nav-link-${item.name.toLowerCase()}`}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all group',
                  isActive
                    ? 'bg-zinc-800/80 text-white border border-zinc-700/60 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-surface-hover border border-transparent'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive
                      ? 'text-brand-400'
                      : 'text-zinc-400 group-hover:text-zinc-300'
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Environment & System Status */}
      <div className="p-4 border-t border-surface-border">
        <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              Infrastructure
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">
              Active
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 leading-relaxed font-sans">
            PostgreSQL 16 & Redis 7 containerized via Docker Compose.
          </div>
          <div className="pt-1 border-t border-surface-border/60 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3" /> Monorepo
            </span>
            <span>v0.1.0-alpha</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

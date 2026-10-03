'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitPullRequest,
  Sparkles,
  Network,
  ShieldAlert,
  ListFilter,
  PlayCircle,
  AlertOctagon,
  FolderGit2,
  Boxes,
  History,
  Settings,
  ShieldCheck,
  Server,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeType?: 'ready' | 'next' | 'planned' | 'unconnected';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'QUALITY INTELLIGENCE',
    items: [
      {
        name: 'Pull Requests',
        href: '/pull-requests',
        icon: GitPullRequest,
        badge: 'Not connected',
        badgeType: 'unconnected',
      },
      {
        name: 'Change Analysis',
        href: '/analysis',
        icon: Sparkles,
        badge: 'Ready',
        badgeType: 'ready',
      },
      {
        name: 'Impact Graph',
        href: '/impact',
        icon: Network,
        badge: 'Ready',
        badgeType: 'ready',
      },
      {
        name: 'Risk Analysis',
        href: '/risk',
        icon: ShieldAlert,
        badge: 'Coming next',
        badgeType: 'next',
      },
    ],
  },
  {
    title: 'TESTING',
    items: [
      {
        name: 'Test Selection',
        href: '/test-selection',
        icon: ListFilter,
        badge: 'Planned',
        badgeType: 'planned',
      },
      {
        name: 'Test Runs',
        href: '/test-runs',
        icon: PlayCircle,
        badge: 'Planned',
        badgeType: 'planned',
      },
      {
        name: 'Failures',
        href: '/failures',
        icon: AlertOctagon,
        badge: 'Planned',
        badgeType: 'planned',
      },
    ],
  },
  {
    title: 'PROJECT',
    items: [
      {
        name: 'Repositories',
        href: '/projects',
        icon: FolderGit2,
      },
      {
        name: 'Integrations',
        href: '/integrations',
        icon: Boxes,
        badge: 'Not connected',
        badgeType: 'unconnected',
      },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      {
        name: 'Activity',
        href: '/activity',
        icon: History,
      },
      {
        name: 'Settings',
        href: '/settings',
        icon: Settings,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const getBadgeClass = (type?: string) => {
    switch (type) {
      case 'ready':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'next':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'unconnected':
        return 'bg-zinc-800 text-zinc-400 border-zinc-700/60';
      case 'planned':
      default:
        return 'bg-zinc-800/80 text-zinc-500 border-zinc-700/40';
    }
  };

  return (
    <aside
      id="main-sidebar"
      className="w-64 border-r border-surface-border bg-surface flex flex-col justify-between h-screen sticky top-0 select-none z-20 overflow-y-auto"
      aria-label="Application Sidebar"
    >
      {/* Top: Branding and Grouped Navigation */}
      <div>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-surface-border flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-1 focus:ring-brand-500 rounded-md p-1"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-600/10 border border-brand-500/30 flex items-center justify-center text-brand-500 group-hover:bg-brand-600/20 transition-colors shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                ReleaseGuard
                <span className="text-[10px] font-mono uppercase px-1 py-0.2 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  AI
                </span>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono tracking-tight">
                Quality Engineering Platform
              </div>
            </div>
          </Link>
        </div>

        {/* Grouped Navigation Sections */}
        <nav className="p-3 space-y-5" aria-label="Main Navigation">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold">
                {section.title}
              </div>

              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    id={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-all group',
                      isActive
                        ? 'bg-zinc-800/90 text-white border border-zinc-700/60 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-surface-hover border border-transparent'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          'w-3.5 h-3.5 shrink-0 transition-colors',
                          isActive
                            ? 'text-brand-400'
                            : 'text-zinc-500 group-hover:text-zinc-300'
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          'px-1.5 py-0.2 rounded text-[9px] font-mono border whitespace-nowrap ml-2',
                          getBadgeClass(item.badgeType)
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom: Infrastructure Status */}
      <div className="p-3 border-t border-surface-border">
        <div className="p-2.5 rounded-lg bg-surface-subtle border border-surface-border space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <Server className="w-3 h-3 text-emerald-400" />
              Local Services
            </span>
            <span className="px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[9px] border border-emerald-500/20">
              Active
            </span>
          </div>
          <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-between">
            <span>PostgreSQL & Redis</span>
            <span className="text-zinc-500">Docker</span>
          </div>
          <div className="pt-1 border-t border-surface-border/50 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
            <span className="flex items-center gap-1">
              <Layers className="w-2.5 h-2.5" /> Monorepo
            </span>
            <span>v0.1.0-foundation</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

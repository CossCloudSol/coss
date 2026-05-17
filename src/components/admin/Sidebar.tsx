'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  Building2,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageCircle,
  Search,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@/lib/permissions';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** The permission key required to see this item. null = visible to all authenticated users. */
  permissionKey: Permission | null;
};

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: '/admin',           label: 'Overview',          icon: LayoutDashboard, permissionKey: 'dashboard:view' },
  { href: '/admin/leads',     label: 'All Leads',         icon: Users,           permissionKey: 'leads:view' },
  { href: '/admin/corporate', label: 'Corporate',         icon: Building2,       permissionKey: 'corporate:view' },
  { href: '/admin/whatsapp',  label: 'WhatsApp Log',      icon: MessageCircle,   permissionKey: 'whatsapp:view' },
  { href: '/admin/seo',       label: 'SEO Manager',       icon: Search,          permissionKey: 'seo:view' },
  { href: '/admin/analytics', label: 'Analytics',         icon: BarChart2,       permissionKey: 'analytics:view' },
  { href: '/admin/topbar',    label: 'Topbar / Ann. Bar', icon: Megaphone,       permissionKey: 'topbar:view' },
  { href: '/admin/settings',  label: 'Settings',          icon: Settings,        permissionKey: 'settings:view' },
];

type SidebarProps = {
  onNavigate?: () => void;
  permissions: string[];
  role?: 'SUPER_ADMIN' | 'ADMISSIONS_SALES' | 'SUPPORT_HELPDESK';
};

function isRouteActive(pathname: string, href: string): boolean {
  if (href === '/admin') {
    return pathname === '/admin' || pathname === '/admin/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({ onNavigate, permissions, role }: SidebarProps): JSX.Element {
  const pathname = usePathname() ?? '';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (isSuperAdmin) return true;
    if (item.permissionKey === null) return true;
    return permissions.includes(item.permissionKey);
  });

  return (
    <aside
      aria-label="Admin navigation"
      className="flex h-full w-[220px] flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-gray-200 dark:border-gray-700">
        <p className="text-xl font-bold leading-none text-teal-600 dark:text-teal-400">COSS</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Admin CRM</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4" aria-label="Primary">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const active = isRouteActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'flex items-center gap-3 px-5 py-2.5 text-sm border-l-4 transition-colors',
                    active
                      ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border-teal-600 dark:border-teal-500 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white border-transparent',
                  ].join(' ')}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${active ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'}`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <a
          href="/api/admin/auth"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white"
        >
          <LogOut className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          <span>Logout</span>
        </a>
      </div>
    </aside>
  );
}

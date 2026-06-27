'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftRight,
  BarChart2,
  BookOpen,
  Braces,
  Briefcase,
  Building,
  Building2,
  Calendar,
  FolderOpen,
  Globe,
  GraduationCap,
  Home,
  Image,
  Layers,
  LayoutDashboard,
  LogOut,
  MapPin,
  Megaphone,
  MessageCircle,
  Search,
  Settings,
  Star,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@/lib/permissions';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permissionKey: Permission | null;
};

type SidebarGroup = {
  header?: string;
  items: ReadonlyArray<NavItem>;
};

const SIDEBAR_GROUPS: ReadonlyArray<SidebarGroup> = [
  {
    items: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard, permissionKey: 'dashboard:view' },
    ],
  },
  {
    header: 'Leads',
    items: [
      { href: '/admin/leads',     label: 'All Leads',     icon: Users,         permissionKey: 'leads:view' },
      { href: '/admin/corporate', label: 'Corporate',     icon: Building2,     permissionKey: 'corporate:view' },
      { href: '/admin/whatsapp',  label: 'WhatsApp Log',  icon: MessageCircle, permissionKey: 'whatsapp:view' },
      { href: '/admin/analytics', label: 'Analytics',     icon: BarChart2,     permissionKey: 'analytics:view' },
    ],
  },
  {
    header: 'Content',
    items: [
      { href: '/admin/categories',     label: 'Categories',      icon: FolderOpen,    permissionKey: 'dashboard:view' },
      { href: '/admin/courses',        label: 'Courses',          icon: GraduationCap, permissionKey: 'dashboard:view' },
      { href: '/admin/blog',           label: 'Blog Posts',       icon: BookOpen,      permissionKey: 'dashboard:view' },
      { href: '/admin/jobs',           label: 'Jobs',             icon: Briefcase,     permissionKey: 'dashboard:view' },
      { href: '/admin/batches',        label: 'Batches',          icon: Calendar,      permissionKey: 'dashboard:view' },
      { href: '/admin/testimonials',   label: 'Testimonials',     icon: Star,          permissionKey: 'dashboard:view' },
      { href: '/admin/hiring-partners',label: 'Hiring Partners',  icon: Building,      permissionKey: 'dashboard:view' },
    ],
  },
  {
    header: 'Site',
    items: [
      { href: '/admin/homepage',       label: 'Homepage',          icon: Home,           permissionKey: 'dashboard:view' },
      { href: '/admin/topbar',         label: 'Topbar / Ann. Bar', icon: Megaphone,      permissionKey: 'topbar:view' },
      { href: '/admin/content-blocks', label: 'Content Blocks',    icon: Layers,         permissionKey: 'dashboard:view' },
      { href: '/admin/media',          label: 'Media Manager',     icon: Image,          permissionKey: 'seo:view' },
      { href: '/admin/redirects',      label: 'Redirects',         icon: ArrowLeftRight, permissionKey: 'dashboard:view' },
    ],
  },
  {
    header: 'SEO and Tech',
    items: [
      { href: '/admin/seo',     label: 'SEO Manager', icon: Search, permissionKey: 'seo:view' },
      { href: '/admin/geo',     label: 'GEO Manager', icon: MapPin, permissionKey: 'seo:view' },
      { href: '/admin/sitemap', label: 'Sitemap',      icon: Globe,  permissionKey: 'seo:view' },
      { href: '/admin/schema',  label: 'Schema',       icon: Braces, permissionKey: 'seo:view' },
    ],
  },
  {
    header: 'Settings',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings, permissionKey: 'settings:view' },
    ],
  },
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

  function canSee(item: NavItem): boolean {
    if (isSuperAdmin) return true;
    if (item.permissionKey === null) return true;
    return permissions.includes(item.permissionKey);
  }

  return (
    <aside
      aria-label="Admin navigation"
      className="flex h-full w-[220px] flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-gray-200 dark:border-gray-700">
        <p className="text-xl font-bold leading-none text-teal-600 dark:text-teal-400">Coss Cloud Solutions</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">IMS (Institute Management System)</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4" aria-label="Primary">
        <ul>
          {SIDEBAR_GROUPS.map((group, gIdx) => {
            const visibleItems = group.items.filter(canSee);
            if (visibleItems.length === 0) return null;

            return (
              <Fragment key={gIdx}>
                {group.header !== undefined && (
                  <li role="presentation" className="px-3 pt-4 pb-1">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-600">
                      {group.header}
                    </span>
                  </li>
                )}
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
              </Fragment>
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

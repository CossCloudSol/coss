'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const TITLE_MAP: ReadonlyArray<readonly [string, string]> = [
  ['/admin/leads', 'All Leads'],
  ['/admin/corporate', 'Corporate'],
  ['/admin/whatsapp', 'WhatsApp Log'],
  ['/admin/seo', 'SEO Manager'],
  ['/admin/analytics', 'Analytics'],
  ['/admin/topbar', 'Topbar / Ann. Bar'],
  ['/admin/homepage', 'Homepage Manager'],
  ['/admin/settings', 'Settings'],
  ['/admin', 'Overview'],
];

function titleForPath(pathname: string): string {
  for (const [prefix, title] of TITLE_MAP) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return title;
    }
  }
  return 'Admin';
}

type AdminShellProps = {
  children: ReactNode;
  permissions: string[];
  role?: 'SUPER_ADMIN' | 'ADMISSIONS_SALES' | 'SUPPORT_HELPDESK';
};

export default function AdminShell({ children, permissions, role }: AdminShellProps): JSX.Element {
  const pathname = usePathname() ?? '';

  const isLoginRoute = pathname === '/admin/login' || pathname.startsWith('/admin/login/');
  if (isLoginRoute) {
    return <>{children}</>;
  }

  const title = titleForPath(pathname);

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Desktop sidebar — lg+ only, flex sibling so no stacking context issues */}
      <div className="hidden lg:flex w-[220px] flex-none flex-col">
        <Sidebar permissions={permissions} role={role} />
      </div>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} />
        {/* pb-16 on mobile keeps content clear of the fixed bottom nav bar */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-3 pb-16 sm:p-4 sm:pb-16 md:p-6 md:pb-16 lg:p-6">
          {children}
        </div>
      </div>

      {/* Mobile bottom nav — outside scroll container, fixed to viewport */}
      <BottomNav />
    </div>
  );
}

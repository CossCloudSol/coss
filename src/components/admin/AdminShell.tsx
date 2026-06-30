'use client';

import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
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

  // Prevent the root <body> from being scrollable while inside the admin shell.
  // The body has `pb-16 md:pb-0` (for the public MobileStickyBar) which makes
  // the body taller than 100vh on mobile, creating scrollable whitespace below
  // the h-screen AdminShell container. Using a class (not inline style) avoids
  // conflicting with BottomNav's `document.body.style.overflow` drawer control.
  useEffect(() => {
    if (isLoginRoute) return;
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isLoginRoute]);
  if (isLoginRoute) {
    return <>{children}</>;
  }

  const title = titleForPath(pathname);

  return (
    <div className="h-screen flex bg-[#f0f4f8] dark:bg-[#0d1117]">
      {/* Desktop sidebar — lg+ only, flex sibling so no stacking context issues */}
      <div className="hidden lg:flex w-[220px] flex-none flex-col">
        <Sidebar permissions={permissions} role={role} />
      </div>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} />
        {/* pb-16 on mobile keeps content clear of the fixed bottom nav bar */}
        <div className="flex-1 overflow-y-auto bg-[#f0f4f8] dark:bg-[#0d1117] p-3 pb-16 sm:p-4 sm:pb-16 md:p-6 md:pb-16 lg:p-6">
          {children}
        </div>
      </div>

      {/* Mobile bottom nav — outside scroll container, fixed to viewport */}
      <BottomNav />
    </div>
  );
}

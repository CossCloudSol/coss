'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

/**
 * Map of pathname → page title shown in the TopBar. Longest-prefix wins so
 * nested routes inherit their parent's title unless explicitly overridden.
 */
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

/**
 * Client wrapper for the admin layout.
 * Receives permissions and role from the server layout (which reads iron-session
 * without a client round-trip) and forwards them to the Sidebar for filtering.
 */
export default function AdminShell({ children, permissions, role }: AdminShellProps): JSX.Element {
  const pathname = usePathname() ?? '';
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Auto-close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Disable body scroll while the mobile drawer is open.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = mobileOpen ? 'hidden' : previous;
    return () => {
      body.style.overflow = previous;
    };
  }, [mobileOpen]);

  // The login page renders its own full-screen card — skip the CRM chrome.
  const isLoginRoute = pathname === '/admin/login' || pathname.startsWith('/admin/login/');
  if (isLoginRoute) {
    return <>{children}</>;
  }

  const title = titleForPath(pathname);

  return (
    // fixed inset-0 visually covers the public site header/footer that are
    // rendered by the root layout. The inner column scrolls independently.
    <div className="fixed inset-0 z-40 bg-gray-50 dark:bg-gray-900">
      {/* Desktop sidebar — only at lg+ so tablets (768-1023px) use the
          drawer instead of cramming a 220px rail into half the viewport. */}
      <div className="absolute inset-y-0 left-0 hidden w-[220px] lg:block">
        <Sidebar permissions={permissions} role={role} />
      </div>

      {/* Mobile / tablet drawer + backdrop */}
      <div
        className={`absolute inset-0 z-50 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          className={`absolute inset-y-0 left-0 w-[220px] transform transition-transform duration-200 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          role="dialog"
          aria-label="Admin navigation"
          aria-modal="true"
        >
          <Sidebar permissions={permissions} role={role} onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>

      {/* Main column */}
      <div className="flex h-full flex-col ml-0 lg:ml-[220px] transition-all">
        <TopBar title={title} onToggleSidebar={() => setMobileOpen(true)} />
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}

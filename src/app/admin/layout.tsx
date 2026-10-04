import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import { getServerSession } from '@/lib/session';
import { ADMIN_PATH_HEADER, isAllowed, requiredAccess } from '@/lib/admin-access';
import { liveAdmin } from '@/lib/admin-guard';

export const metadata: Metadata = {
  title: {
    default: 'Admin CRM',
    template: '%s | Coss Cloud Solutions Admin',
  },
  robots: { index: false, follow: false },
};

/**
 * Server layout for every /admin/* route.
 *
 * The middleware has already checked the session cookie. Here the user is
 * re-read from the database (second layer): a disabled user goes back to the
 * login page, a user whose role no longer opens this page goes to
 * /admin/unauthorized, and the sidebar and bottom nav get the live role and
 * permissions rather than the ones in the cookie. Layouts persist across
 * client-side navigation, so this runs on full page loads; the data itself is
 * guarded per request by requireAdmin() in every /api/admin route.
 */
export default async function AdminLayout({ children }: { children: ReactNode }): Promise<JSX.Element> {
  const pathname = headers().get(ADMIN_PATH_HEADER) ?? '/admin';
  const access = requiredAccess(pathname);
  const session = await getServerSession();
  if (access.kind === 'public') {
    // Login, password reset, unauthorized: no redirects; a signed-in user still sees their menu.
    const user = session.isAdmin ? await liveAdmin(session).catch(() => null) : null;
    return (
      <AdminShell permissions={user ? [...user.permissions] : []} role={user?.role}>
        {children}
      </AdminShell>
    );
  }

  const live = await liveAdmin(session);
  if (!live) redirect('/admin/login');
  if (!isAllowed(access, live)) redirect('/admin/unauthorized');
  return (
    <AdminShell permissions={[...live.permissions]} role={live.role}>
      {children}
    </AdminShell>
  );
}

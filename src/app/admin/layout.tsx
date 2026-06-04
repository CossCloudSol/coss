import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { getServerSession } from '@/lib/session';

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
 * Reads the iron-session server-side so that the client AdminShell receives
 * the authenticated user's permissions and role without an extra round-trip.
 * This is what gates the sidebar navigation items.
 */
export default async function AdminLayout({ children }: { children: ReactNode }): Promise<JSX.Element> {
  const session = await getServerSession();
  return (
    <AdminShell permissions={session.permissions ?? []} role={session.role}>
      {children}
    </AdminShell>
  );
}

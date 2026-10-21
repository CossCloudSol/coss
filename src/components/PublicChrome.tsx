'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { installIntentListener } from '@/lib/intent-listener';

interface PublicChromeProps {
  children: ReactNode;
  /**
   * Installs the site-wide CTA click listener (lib/intent-listener) while on a public page.
   * Set on exactly one PublicChrome in the root layout so there is one listener.
   */
  clickTracking?: boolean;
}

/**
 * Render-only-on-public-routes wrapper.
 *
 * The site-wide topbar / header / footer are inlined directly in the root
 * `src/app/layout.tsx` (instead of being extracted into a `<Navbar />`
 * component) so server-side rendering stays simple. That means without this
 * gate they would also render inside the admin CRM at `/admin/*` and overlap
 * the admin shell.
 *
 * Wrapping each block of public chrome in `<PublicChrome>` short-circuits the
 * render whenever the user is anywhere under `/admin`. Layout.tsx stays a
 * server component so the `metadata` export keeps working.
 */
export default function PublicChrome({
  children,
  clickTracking = false,
}: PublicChromeProps): JSX.Element | null {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    if (!clickTracking || isAdmin) return;
    return installIntentListener();
  }, [clickTracking, isAdmin]);

  if (isAdmin) {
    return null;
  }
  return <>{children}</>;
}

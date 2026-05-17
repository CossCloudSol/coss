'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface PublicChromeProps {
  children: ReactNode;
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
}: PublicChromeProps): JSX.Element | null {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) {
    return null;
  }
  return <>{children}</>;
}

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// The page is a client component, so the admin page conventions live here.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Promo Banners' };

export default function PromoBannersLayout({ children }: { children: ReactNode }): JSX.Element {
  return <>{children}</>;
}

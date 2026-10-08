import type { Metadata } from 'next';
import Link from 'next/link';
import { PageBanner, ResponsivePageStyles } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Page Not Found | Coss Cloud Solutions',
  robots: { index: false, follow: true },
};

const LINKS = [
  { href: '/courses', label: 'Browse all courses' },
  { href: '/batches', label: 'See upcoming batches' },
  { href: '/blog', label: 'Read the blog' },
  { href: '/contact-us', label: 'Contact us' },
];

/** Shown for any URL that doesn't exist (HTTP 404). */
export default function NotFound() {
  return (
    <>
      <ResponsivePageStyles />
      <PageBanner title="Page Not Found" />
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '56px 20px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-poppins), Poppins, sans-serif', fontWeight: 700, fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>
          We couldn&apos;t find that page.
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.7, marginBottom: '28px' }}>
          It may have moved, or the link may be mistyped. These pages are a good place to start:
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', padding: '0 20px', borderRadius: '8px', border: '1.5px solid #024c57', color: '#024c57', fontFamily: 'var(--font-poppins), Poppins, sans-serif', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/"
          style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', padding: '0 22px', borderRadius: '8px', background: '#e8401c', color: '#fff', fontFamily: 'var(--font-poppins), Poppins, sans-serif', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}
        >
          Back to Home
        </Link>
      </div>
    </>
  );
}

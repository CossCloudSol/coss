/**
 * src/lib/build-course-page-metadata.ts
 *
 * Generates a Next.js Metadata object for any of the 36 static course pages
 * by looking up the slug in COURSE_PAGES registry.
 *
 * Usage in a course page.tsx:
 *
 *   import type { Metadata } from 'next';
 *   import { buildCoursePageMetadata } from '@/lib/build-course-page-metadata';
 *
 *   export const metadata: Metadata = buildCoursePageMetadata(
 *     'big-data-training-institute-in-hyderabad'
 *   );
 */

import type { Metadata } from 'next';
import { COURSE_PAGES } from '@/lib/all-pages-registry';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

const SITE_NAME = 'Coss Cloud Solutions';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

/**
 * Returns a complete Next.js Metadata object for the given course page slug.
 * Falls back to a generic description if the slug is not found in the registry
 * (shouldn't happen in production, but safe for development).
 */
export function buildCoursePageMetadata(slug: string): Metadata {
  const page = COURSE_PAGES.find((p) => p.slug === slug);

  if (!page) {
    // Fallback — should not happen if slug matches the registry
    return {
      title: 'IT Training in Hyderabad',
      description:
        'Best IT Training Institute in Hyderabad with 100% placement support.',
    };
  }

  const canonicalUrl = `${SITE_URL}/${slug}`;
  const ogTitle = page.title;
  const ogDescription = page.metaDescription;

  return {
    title: page.title,
    description: page.metaDescription,
    keywords: page.keywords,

    // Canonical URL — tells Google the authoritative URL for this page
    alternates: {
      canonical: canonicalUrl,
    },

    // Open Graph — controls how the page appears when shared on social media
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_IN',
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${ogTitle} — Coss Cloud Solutions`,
        },
      ],
    },

    // Twitter card
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [DEFAULT_OG_IMAGE],
    },

    // Standard robots directive
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
  };
}

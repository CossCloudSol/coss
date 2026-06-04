/**
 * src/lib/build-category-page-metadata.ts
 *
 * Generates a Next.js Metadata object for any category overview page
 * by looking up the slug in CATEGORY_PAGES registry.
 *
 * Usage in a category page.tsx:
 *
 *   import type { Metadata } from 'next';
 *   import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
 *
 *   export const metadata: Metadata = buildCategoryPageMetadata('courses/cloud-computing');
 */

import type { Metadata } from 'next';
import { CATEGORY_PAGES } from '@/lib/all-pages-registry';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

const SITE_NAME = 'Coss Cloud Solutions';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export function buildCategoryPageMetadata(slug: string): Metadata {
  const page = CATEGORY_PAGES.find((p) => p.slug === slug);

  if (!page) {
    return {
      title: 'IT Training in Hyderabad',
      description:
        'Best IT Training Institute in Hyderabad with 100% placement support.',
    };
  }

  const canonicalUrl = `${SITE_URL}/${slug}`;

  return {
    title: page.title,
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_IN',
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${page.title} — Coss Cloud Solutions`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.metaDescription,
      images: [DEFAULT_OG_IMAGE],
    },
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

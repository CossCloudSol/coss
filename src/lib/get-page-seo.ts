import type { Metadata } from 'next';
import type { SeoSettings } from '@prisma/client';
import { prisma } from './db';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';
const DEFAULT_SITE_TITLE = 'COSS Cloud Solutions';

export interface PageSeoBundle {
  seo: import('@prisma/client').PageSeo | null;
  settings: SeoSettings | null;
}

/* -------------------------------------------------------------------------- */
/*  SeoSettings in-memory cache                                               */
/*  SeoSettings changes only when an admin edits the dashboard — fetching it  */
/*  on every page render wastes a DB connection. Cache for 5 minutes.         */
/* -------------------------------------------------------------------------- */

let cachedSettings: SeoSettings | null | undefined = undefined;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getSeoSettings(): Promise<SeoSettings | null> {
  if (cachedSettings !== undefined && Date.now() - cacheTime < CACHE_TTL) {
    return cachedSettings;
  }
  try {
    cachedSettings = await prisma.seoSettings.findFirst();
    cacheTime = Date.now();
    return cachedSettings;
  } catch {
    // Return the stale cached value if available, otherwise null.
    return cachedSettings ?? null;
  }
}

/* -------------------------------------------------------------------------- */
/*  getPageSeo                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Fetch the per-page SEO row plus the singleton site settings in parallel.
 * Returns nulls on DB timeout — callers fall back to safe defaults.
 */
export async function getPageSeo(slug: string): Promise<PageSeoBundle> {
  try {
    const [seo, settings] = await Promise.all([
      prisma.pageSeo.findUnique({ where: { pageSlug: slug } }),
      getSeoSettings(),
    ]);
    return { seo, settings };
  } catch (error) {
    console.warn(`[SEO] DB unavailable for slug "${slug}":`, error);
    return { seo: null, settings: cachedSettings ?? null };
  }
}

/* -------------------------------------------------------------------------- */
/*  buildPageMetadata                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Build a Next.js `Metadata` object for a given page slug. Every public page
 * exports `generateMetadata` that simply calls this helper. Falls back to
 * safe site-wide defaults when the DB is unavailable or no row exists yet.
 */
export async function buildPageMetadata(slug: string): Promise<Metadata> {
  try {
    const { seo, settings } = await getPageSeo(slug);

    const siteName = settings?.siteTitle ?? DEFAULT_SITE_TITLE;
    const siteSuffix = ` | ${siteName}`;

    const title = seo?.metaTitle
      ? `${seo.metaTitle}${siteSuffix}`
      : siteName;
    const description =
      seo?.metaDescription ?? 'COSS Cloud Solutions — IT Training in Hyderabad';

    const ogTitle = seo?.ogTitle ?? seo?.metaTitle ?? siteName;
    const ogDescription = seo?.ogDescription ?? description;
    const ogImage = seo?.ogImage ?? settings?.defaultOgImage ?? null;

    return {
      title,
      description,
      keywords: seo?.keywords ?? undefined,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        images: ogImage ? [{ url: ogImage }] : [],
        url: seo?.canonicalUrl ?? SITE_URL,
        siteName,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitle,
        description: ogDescription,
        images: ogImage ? [ogImage] : [],
      },
      robots: {
        index: !(seo?.noIndex ?? false),
        follow: !(seo?.noFollow ?? false),
      },
      alternates: seo?.canonicalUrl
        ? { canonical: seo.canonicalUrl }
        : undefined,
      other: settings?.googleSearchConsoleId
        ? { 'google-site-verification': settings.googleSearchConsoleId }
        : undefined,
    };
  } catch (error) {
    console.warn(`[SEO] buildPageMetadata failed for "${slug}":`, error);
    return {
      title: 'COSS Cloud Solutions - IT Training in Hyderabad',
      description:
        'Best IT Training Institute in Hyderabad with 100% placement support.',
    };
  }
}

/**
 * Like buildPageMetadata but merges DB overrides on top of a supplied
 * fallback object. Used by course pages and category pages that already
 * have good hardcoded metadata but should be admin-editable.
 *
 * Priority: DB row (if metaTitle set) > fallback
 */
export async function buildPageMetadataWithFallback(
  slug: string,
  fallback: Metadata,
): Promise<Metadata> {
  try {
    const { seo, settings } = await getPageSeo(slug);
    if (!seo?.metaTitle || seo.metaTitle.trim() === '') return fallback;

    const siteName = settings?.siteTitle ?? DEFAULT_SITE_TITLE;
    const siteSuffix = ` | ${siteName}`;

    const title = `${seo.metaTitle}${siteSuffix}`;
    const description = seo.metaDescription ?? (fallback.description as string | undefined) ?? '';
    const ogTitle = seo.ogTitle ?? seo.metaTitle;
    const ogDescription = seo.ogDescription ?? description;
    const ogImage = seo.ogImage ?? settings?.defaultOgImage ?? null;

    return {
      ...fallback,
      title,
      description,
      keywords: seo.keywords ?? fallback.keywords,
      openGraph: {
        ...(typeof fallback.openGraph === 'object' ? fallback.openGraph : {}),
        title: ogTitle,
        description: ogDescription,
        images: ogImage ? [{ url: ogImage }] : (fallback.openGraph as { images?: unknown } | null)?.images as never ?? [],
        url: seo.canonicalUrl ?? SITE_URL,
        siteName,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitle,
        description: ogDescription,
        images: ogImage ? [ogImage] : [],
      },
      robots: {
        index: !(seo.noIndex ?? false),
        follow: !(seo.noFollow ?? false),
      },
      alternates: seo.canonicalUrl ? { canonical: seo.canonicalUrl } : fallback.alternates,
    };
  } catch {
    return fallback;
  }
}

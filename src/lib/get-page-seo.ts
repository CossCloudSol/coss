import type { Metadata } from 'next';
import type { SeoSettings } from '@prisma/client';
import { prisma } from './db';
import { buildTitle } from './build-title';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';
const DEFAULT_SITE_TITLE = 'Coss Cloud Solutions';
const PRODUCTION_ORIGIN = 'https://www.cosscloudsol.com';

// Build-time sanity check: every canonical/OG URL in this build is derived from
// SITE_URL. A wrong NEXT_PUBLIC_SITE_URL (e.g. a preview deploy's origin) silently
// pushes that wrong origin into every page. Warn loudly once; never throw — preview
// builds with an intentionally different origin must still complete.
try {
  const builtOrigin = new URL(SITE_URL).origin;
  if (builtOrigin !== PRODUCTION_ORIGIN) {
    console.warn(
      `[SEO] NEXT_PUBLIC_SITE_URL origin is "${builtOrigin}", not the production origin "${PRODUCTION_ORIGIN}". Every canonical and OG URL built in this run will use "${builtOrigin}".`,
    );
  }
} catch {
  console.warn(`[SEO] NEXT_PUBLIC_SITE_URL is not a valid URL: "${SITE_URL}".`);
}

// Sitewide fallback OG image. Used whenever a page has no admin-set PageSeo.ogImage,
// no SeoSettings.defaultOgImage, and (for buildPageMetadataWithFallback) no
// caller-supplied openGraph.images either. TODO: this is the generic site logo/hero
// asset — a dedicated 1200x630 branded OG image should be designed to replace it.
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

/**
 * The admin "Google Search Console ID" field is meant to hold just the
 * verification token, but has at least once been filled in with the whole
 * `<meta name="google-site-verification" content="..." />` tag copy-pasted
 * from Search Console's instructions. Rendered raw, that produces a broken,
 * HTML-escaped meta tag in <head>. Extract the inner content attribute when
 * that shape is detected; otherwise pass the value through unchanged.
 */
export function sanitizeGscVerificationId(raw: string): string {
  const trimmed = raw.trim();
  const metaTagMatch = trimmed.match(/<meta\b[^>]*\bcontent=["']([^"']+)["'][^>]*>/i);
  if (metaTagMatch) {
    console.warn(`[SEO] googleSearchConsoleId contained a full <meta> tag, not just the token — extracted content attribute. Raw value: ${raw}`);
    return metaTagMatch[1];
  }
  return trimmed;
}

function firstImageUrl(images: unknown): string | undefined {
  if (!Array.isArray(images) || images.length === 0) return undefined;
  const first = images[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && typeof (first as { url?: unknown }).url === 'string') {
    return (first as { url: string }).url;
  }
  return undefined;
}

/**
 * Strips query params and trailing slash (site uses trailingSlash: false)
 * from any canonical URL — admin-entered or computed — so canonicals never
 * mismatch the actual rendered URL.
 */
function normalizeCanonical(url: string): string {
  try {
    const u = new URL(url);
    u.search = '';
    if (u.pathname !== '/' && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return url;
  }
}

function safePathname(url: string): string | undefined {
  try {
    return new URL(url).pathname;
  } catch {
    return undefined;
  }
}

// Set once a build has logged an origin-only canonical difference, so a bad
// NEXT_PUBLIC_SITE_URL doesn't spam a warning per page — the assertion at
// module load already names the offending origin once.
let originMismatchWarnedThisBuild = false;

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

/**
 * Parses a PageSeo row's admin-authored custom schemaMarkup JSON, if any.
 * Returns null (and logs) on missing row or invalid JSON — never throws, so
 * a page can always safely render the result as an extra JSON-LD block.
 */
export async function getPageSchemaMarkup(slug: string): Promise<object | null> {
  try {
    const { seo } = await getPageSeo(slug);
    if (!seo?.schemaMarkup || seo.schemaMarkup.trim() === '') return null;
    return JSON.parse(seo.schemaMarkup);
  } catch (error) {
    console.log(`[SEO] Invalid schemaMarkup JSON for "${slug}", skipping:`, error);
    return null;
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
    const finalTitle = buildTitle(seo?.metaTitle || siteName);
    const description =
      seo?.metaDescription ?? 'Coss Cloud Solutions — IT Training in Hyderabad';

    const ogTitle = seo?.ogTitle?.trim() ? seo.ogTitle : finalTitle;
    const ogDescription = seo?.ogDescription ?? description;
    const ogImage = seo?.ogImage ?? settings?.defaultOgImage ?? DEFAULT_OG_IMAGE;

    const defaultCanonical = slug === 'home' ? SITE_URL : `${SITE_URL}/${slug}`;
    const canonicalUrl = normalizeCanonical(seo?.canonicalUrl?.trim() || defaultCanonical);

    return {
      title: { absolute: finalTitle },
      description,
      keywords: seo?.keywords ?? undefined,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        images: [{ url: ogImage }],
        url: canonicalUrl,
        siteName,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitle,
        description: ogDescription,
        images: [ogImage],
      },
      robots: {
        index: !(seo?.noIndex ?? false),
        follow: !(seo?.noFollow ?? false),
      },
      alternates: { canonical: canonicalUrl },
      other: settings?.googleSearchConsoleId
        ? { 'google-site-verification': sanitizeGscVerificationId(settings.googleSearchConsoleId) }
        : undefined,
    };
  } catch (error) {
    console.warn(`[SEO] buildPageMetadata failed for "${slug}":`, error);
    return {
      title: { absolute: 'Coss Cloud Solutions — IT Training in Hyderabad' },
      description:
        'Best IT Training Institute in Hyderabad with 100% placement support.',
    };
  }
}

/**
 * Like buildPageMetadata but merges DB overrides on top of a supplied
 * fallback object. Used by course pages, category pages and blog posts that
 * already have good hardcoded/DB-record metadata but should stay
 * admin-editable via the PageSeo table.
 *
 * Priority per field: PageSeo admin override (if set) > fallback > computed default.
 * Title, canonical and robots are ALWAYS computed (never returned as raw
 * fallback) so every page gets exactly one brand mention and a
 * self-referencing canonical even when no PageSeo row exists yet.
 */
export async function buildPageMetadataWithFallback(
  slug: string,
  fallback: Metadata,
): Promise<Metadata> {
  try {
    const { seo, settings } = await getPageSeo(slug);

    const siteName = settings?.siteTitle ?? DEFAULT_SITE_TITLE;
    const fallbackTitle = typeof fallback.title === 'string' ? fallback.title : siteName;
    const finalTitle = buildTitle(seo?.metaTitle?.trim() || fallbackTitle);

    const description =
      seo?.metaDescription ?? (fallback.description as string | undefined) ?? '';

    const fallbackOg =
      fallback.openGraph && typeof fallback.openGraph === 'object' ? fallback.openGraph : {};
    const ogTitle = seo?.ogTitle?.trim() ? seo.ogTitle : finalTitle;
    const ogDescription =
      seo?.ogDescription ?? (fallbackOg as { description?: string }).description ?? description;
    const fallbackImage = firstImageUrl((fallbackOg as { images?: unknown }).images);
    const ogImage = seo?.ogImage ?? settings?.defaultOgImage ?? fallbackImage ?? DEFAULT_OG_IMAGE;
    const ogType = (fallbackOg as { type?: string }).type ?? 'website';

    const fallbackCanonical =
      fallback.alternates &&
      typeof fallback.alternates === 'object' &&
      'canonical' in fallback.alternates
        ? (fallback.alternates.canonical as string | undefined)
        : undefined;

    const dbCanonicalRaw = seo?.canonicalUrl?.trim() || undefined;
    let canonicalUrl: string;
    if (dbCanonicalRaw && fallbackCanonical) {
      const normalizedDb = normalizeCanonical(dbCanonicalRaw);
      const normalizedComputed = normalizeCanonical(fallbackCanonical);
      // The guard only arbitrates PATH — the DB row is the source of truth for
      // URL shape (e.g. legacy vs. nested course paths). A full-URL comparison
      // here would also flag a build-time origin difference (wrong
      // NEXT_PUBLIC_SITE_URL) as a "mismatch" and let a bad origin override an
      // otherwise-correct DB canonical.
      const dbPath = safePathname(normalizedDb);
      const computedPath = safePathname(normalizedComputed);
      if (dbPath !== undefined && computedPath !== undefined && dbPath !== computedPath) {
        console.warn(
          `[SEO] canonical mismatch for "${slug}": stored DB value "${normalizedDb}" differs from computed fallback "${normalizedComputed}". Using computed fallback — a DB row must not override the real canonical URL logic.`,
        );
        canonicalUrl = normalizedComputed;
      } else if (dbPath !== undefined && normalizedDb !== normalizedComputed) {
        // Paths agree; only the origin differs. Not a real mismatch — always
        // canonicalize to the production origin regardless of which origin
        // either side happened to be built with.
        if (!originMismatchWarnedThisBuild) {
          console.warn(
            `[SEO] canonical origin differs from computed fallback for "${slug}" (path matches: "${dbPath}") — DB "${normalizedDb}" vs computed "${normalizedComputed}". Using the production origin for the rest of this build; not logging further per-page origin diffs.`,
          );
          originMismatchWarnedThisBuild = true;
        }
        canonicalUrl = `${PRODUCTION_ORIGIN}${dbPath}`;
      } else {
        canonicalUrl = normalizedDb;
      }
    } else {
      canonicalUrl = normalizeCanonical(dbCanonicalRaw || fallbackCanonical || `${SITE_URL}/${slug}`);
    }

    return {
      ...fallback,
      title: { absolute: finalTitle },
      description,
      keywords: seo?.keywords ?? fallback.keywords,
      openGraph: {
        ...fallbackOg,
        title: ogTitle,
        description: ogDescription,
        images: [{ url: ogImage }],
        url: canonicalUrl,
        siteName,
        type: ogType as never,
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitle,
        description: ogDescription,
        images: [ogImage],
      },
      robots: {
        index: !(seo?.noIndex ?? false),
        follow: !(seo?.noFollow ?? false),
      },
      alternates: { canonical: canonicalUrl },
    };
  } catch {
    return fallback;
  }
}

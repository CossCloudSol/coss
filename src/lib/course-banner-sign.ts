/**
 * Signed URLs for generated course banners (server only: reads a secret).
 *
 * The banner route runs on the Edge runtime with no database, so the URL
 * carries the title and category; an HMAC over them (with the admin session
 * secret, domain-separated) stops anyone rendering arbitrary text on our
 * domain. The signature is also the cache key: it changes whenever the
 * title or category does, so the image can be cached as immutable.
 * Web Crypto only, so it runs both in the Node build and on the Edge.
 */

/** Bump when the banner design changes, so every cached image is replaced. */
const DESIGN_VERSION = '1';

const encoder = new TextEncoder();
let keyPromise: Promise<CryptoKey> | null = null;

function signingKey(): Promise<CryptoKey> {
  keyPromise ??= crypto.subtle.importKey(
    'raw',
    encoder.encode(`course-banner|${process.env.ADMIN_SESSION_SECRET ?? 'coss-course-banner-dev'}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return keyPromise;
}

export async function bannerSignature(slug: string, title: string, category: string, categorySlug: string): Promise<string> {
  const mac = await crypto.subtle.sign('HMAC', await signingKey(), encoder.encode([DESIGN_VERSION, slug, title, category, categorySlug].join('\u0000')));
  return Array.from(new Uint8Array(mac).slice(0, 10), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time comparison of two hex strings. */
export function sameSignature(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Wide banner URL (800×400) for cards and og:image. Add `&s=sq` (see
 * squareBannerPath) for the 256×256 thumbnail variant.
 */
export async function courseBannerPath(course: { slug: string; title: string; category: string; categorySlug: string | null }): Promise<string> {
  const title = course.title.trim();
  const category = course.category.trim();
  const k = course.categorySlug ?? '';
  const v = await bannerSignature(course.slug, title, category, k);
  const q = new URLSearchParams({ t: title, c: category, k, v });
  return `/course-banner/${encodeURIComponent(course.slug)}?${q.toString()}`;
}

/**
 * og:image for a course page: the admin thumbnail, else its generated banner
 * (absolute URL, 800×400).
 */
export async function courseOgImages(
  course: { slug: string; title: string; category: string; categorySlug: string | null; thumbnail: string | null },
  siteUrl: string,
): Promise<Array<{ url: string; width?: number; height?: number; alt: string }>> {
  if (course.thumbnail) return [{ url: course.thumbnail, alt: course.title }];
  return [{ url: `${siteUrl}${await courseBannerPath(course)}`, width: 800, height: 400, alt: `${course.title}: ${course.category} course` }];
}

/**
 * Signed URLs for generated course banners (server only: reads a secret).
 *
 * The banner route runs on the Edge runtime with no database, so the URL
 * carries the title and category; an HMAC over them stops anyone rendering
 * arbitrary text on our domain. The signature is also the cache key: it
 * changes whenever the title or category does, so the image can be cached
 * as immutable. Web Crypto only, so it runs both in the Node build and on
 * the Edge.
 *
 * Key: derived, never the session secret itself —
 *   bannerKey = HMAC-SHA256(ADMIN_SESSION_SECRET, "coss:course-banner:v2")
 * No extra env var. Without the secret in production, banners are switched
 * off (courseBannerPath returns null, the route answers 404) instead of
 * being signed with a guessable key; local builds use a dev-only fallback.
 */

/** Bump when the banner design changes, so every cached image is replaced. */
const DESIGN_VERSION = '2';

const KEY_NAMESPACE = 'coss:course-banner:v2';
const encoder = new TextEncoder();
let keyPromise: Promise<CryptoKey | null> | null = null;

function hmacKey(raw: BufferSource): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function deriveKey(): Promise<CryptoKey | null> {
  const secret = process.env.ADMIN_SESSION_SECRET || (process.env.NODE_ENV !== 'production' ? 'coss-course-banner-dev-only' : '');
  if (!secret) {
    console.error('[course-banner] ADMIN_SESSION_SECRET is not set: generated banners are disabled');
    return null;
  }
  const derived = await crypto.subtle.sign('HMAC', await hmacKey(encoder.encode(secret)), encoder.encode(KEY_NAMESPACE));
  return hmacKey(derived);
}

function signingKey(): Promise<CryptoKey | null> {
  keyPromise ??= deriveKey();
  return keyPromise;
}

/**
 * Hex signature of a banner's parameters, or null when signing is unavailable.
 * `hook` (Instagram portrait only) is signed when present; without it the
 * signature is unchanged, so existing card and og:image URLs stay valid.
 */
export async function bannerSignature(slug: string, title: string, category: string, categorySlug: string, hook = ''): Promise<string | null> {
  const key = await signingKey();
  if (!key) return null;
  const parts = [DESIGN_VERSION, slug, title, category, categorySlug, ...(hook ? [hook] : [])];
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(parts.join('\u0000')));
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
 * Wide banner URL (800×400) for cards and og:image, or null when banners are
 * disabled. Add `&s=sq` (see squareBannerPath) for the 256×256 variant.
 */
export async function courseBannerPath(course: { slug: string; title: string; category: string; categorySlug: string | null }): Promise<string | null> {
  const title = course.title.trim();
  const category = course.category.trim();
  const k = course.categorySlug ?? '';
  const v = await bannerSignature(course.slug, title, category, k);
  if (!v) return null;
  const q = new URLSearchParams({ t: title, c: category, k, v });
  return `/course-banner/${encodeURIComponent(course.slug)}?${q.toString()}`;
}

/**
 * Instagram portrait banner (1080×1350): wordmark, course title and the
 * post's hook line (signed with the rest), or null when banners are disabled.
 */
export async function instagramBannerPath(
  course: { slug: string; title: string; category: string; categorySlug: string | null },
  hook: string,
): Promise<string | null> {
  const title = course.title.trim();
  const category = course.category.trim();
  const k = course.categorySlug ?? '';
  const h = hook.trim();
  const v = await bannerSignature(course.slug, title, category, k, h);
  if (!v) return null;
  const q = new URLSearchParams({ t: title, c: category, k, h, v, s: 'ig' });
  return `/course-banner/${encodeURIComponent(course.slug)}?${q.toString()}`;
}

/**
 * og:image for a course page: the admin thumbnail, else its generated banner
 * (absolute URL, 800×400, the s=og variant with the site address); empty when neither exists (site default applies).
 */
export async function courseOgImages(
  course: { slug: string; title: string; category: string; categorySlug: string | null; thumbnail: string | null },
  siteUrl: string,
): Promise<Array<{ url: string; width?: number; height?: number; alt: string }>> {
  if (course.thumbnail) return [{ url: course.thumbnail, alt: course.title }];
  const path = await courseBannerPath(course);
  return path ? [{ url: `${siteUrl}${path}&s=og`, width: 800, height: 400, alt: `${course.title}: ${course.category} course` }] : [];
}

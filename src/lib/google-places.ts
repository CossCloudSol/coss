/**
 * Google Places API (New) Place Details: the live rating for one listing.
 * Dependency-free so `node --test` can import it (scripts/test/google-places.test.mjs);
 * src/lib/google-rating.ts adds the cache and the server-only guard.
 *
 * Attribution is mandatory wherever the rating shows ("on Google" + a link to
 * the listing), so a result without a usable googleMapsUri counts as bad data.
 */

export interface GoogleRating {
  /** Average rating, 1–5. */
  rating: number;
  /** Number of Google reviews behind the average. */
  count: number;
  /** The listing on Google Maps: the attribution link. */
  mapsUri: string;
}

/** A slow Google response must not stall a build or a render. */
export const PLACES_TIMEOUT_MS = 5000;
const MAPS_URI = /^https:\/\/(?:maps\.google\.com|www\.google\.com\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)\//;

type Env = Record<string, string | undefined>;

/**
 * Next.js control-flow errors (dynamic usage, redirect, notFound, bail-out to
 * client rendering) carry a `digest`. They must reach Next untouched: wrapping
 * or swallowing one silently changes how a page renders (that's how a
 * DynamicServerError once hid the rating on every prerendered page).
 */
export function isNextInternalError(err: unknown): boolean {
  const digest = (err as { digest?: unknown } | null | undefined)?.digest;
  return typeof digest === 'string' && (digest === 'DYNAMIC_SERVER_USAGE' || digest === 'BAILOUT_TO_CLIENT_SIDE_RENDERING' || digest.startsWith('NEXT_'));
}

/**
 * Fetches the rating or THROWS (missing env var, non-200, network error,
 * timeout, bad data). Never returns null: throwing is what keeps a failure out
 * of the 24 h cache around it (unstable_cache doesn't store a rejection).
 */
export async function fetchPlaceRating(env: Env, fetchImpl: typeof fetch = fetch, timeoutMs = PLACES_TIMEOUT_MS): Promise<GoogleRating> {
  const key = env.GOOGLE_PLACES_API_KEY?.trim();
  const placeId = env.GOOGLE_PLACE_ID_DILSUKHNAGAR?.trim();
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY is not set');
  if (!placeId) throw new Error('GOOGLE_PLACE_ID_DILSUKHNAGAR is not set');

  let res: Response;
  try {
    // No `cache` option: inside unstable_cache Next already forces no-store,
    // while an explicit cache: 'no-store' during static/ISR generation throws
    // DynamicServerError before the request is made (patch-fetch).
    res = await fetchImpl(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri' },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (isNextInternalError(err)) throw err;
    const name = err instanceof Error ? err.name : '';
    throw new Error(name === 'TimeoutError' || name === 'AbortError' ? `Places API timed out after ${timeoutMs} ms` : `Places API request failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!res.ok || res.status !== 200) throw new Error(`Places API HTTP ${res.status}`);

  let body: { rating?: unknown; userRatingCount?: unknown; googleMapsUri?: unknown };
  try {
    body = await res.json();
  } catch {
    throw new Error('Places API returned invalid JSON');
  }
  const { rating, userRatingCount, googleMapsUri } = body;
  if (typeof rating !== 'number' || !Number.isFinite(rating) || rating < 1 || rating > 5) throw new Error('Places API: rating missing or out of range');
  if (typeof userRatingCount !== 'number' || !Number.isInteger(userRatingCount) || userRatingCount < 1) throw new Error('Places API: userRatingCount missing or invalid');
  if (typeof googleMapsUri !== 'string' || !MAPS_URI.test(googleMapsUri)) throw new Error('Places API: googleMapsUri missing or not a Google Maps link');
  return { rating, count: userRatingCount, mapsUri: googleMapsUri };
}

/** One line, no URL (place id), nothing key-shaped. */
export function failureLine(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const clean = raw
    .replace(/https?:\/\/\S+/gi, '[url]')
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[key]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  return `[google-rating] hidden: ${clean}`;
}

/**
 * Wraps the (cached) loader so a page only ever gets a rating or null: an
 * ordinary failure becomes null (rating hidden) and is logged once per
 * process as one console.warn line. Next.js internals are rethrown.
 */
export function ratingGetter(
  load: () => Promise<GoogleRating>,
  opts: { log?: (line: string) => void; isInternal?: (err: unknown) => boolean } = {},
): () => Promise<GoogleRating | null> {
  const log = opts.log ?? ((line: string) => console.warn(line));
  const isInternal = opts.isInternal ?? isNextInternalError;
  const logged = new Set<string>();
  return async () => {
    try {
      return await load();
    } catch (err) {
      if (isInternal(err)) throw err;
      const line = failureLine(err);
      if (!logged.has(line)) {
        logged.add(line);
        log(line);
      }
      return null;
    }
  };
}

/**
 * Concurrent callers share one in-flight call (per worker process: each
 * build worker or server instance has its own). Every page renders the
 * header strip, so a build or a burst of ISR regenerations would otherwise
 * send dozens of identical requests at once.
 */
export function dedupeInFlight<T>(fn: () => Promise<T>): () => Promise<T> {
  let inflight: Promise<T> | null = null;
  return () => {
    inflight ??= fn().finally(() => {
      inflight = null;
    });
    return inflight;
  };
}

/** "★ {rating}/5 on Google ({count} reviews)": one decimal, Indian digit grouping. */
export function ratingLabel(r: Pick<GoogleRating, 'rating' | 'count'>): string {
  return `★ ${r.rating.toFixed(1)}/5 on Google (${r.count.toLocaleString('en-IN')} ${r.count === 1 ? 'review' : 'reviews'})`;
}

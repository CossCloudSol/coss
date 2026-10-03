/**
 * Google Places API (New) Place Details: the live rating for one listing.
 * Dependency-free so `node --test` can import it (scripts/test/google-places.test.mjs);
 * src/lib/google-rating.ts adds the cache and the server-only guard.
 *
 * Attribution is mandatory wherever the rating shows ("on Google" + a link to
 * the listing), so a result without a usable googleMapsUri counts as bad data.
 */

export interface GoogleRating {
  /** Average rating, 1–5, e.g. 4.7. */
  rating: number;
  /** Number of Google reviews behind the average. */
  count: number;
  /** The listing on Google Maps: the attribution link. */
  mapsUri: string;
}

export const PLACES_TIMEOUT_MS = 5_000;
const MAPS_URI = /^https:\/\/(?:maps\.google\.com|www\.google\.com\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)\//;

type Env = Record<string, string | undefined>;

/**
 * Fetches the rating or THROWS (missing env var, non-200, timeout, bad data).
 * Throwing is what keeps a failure out of the 24 h cache.
 */
export async function fetchPlaceRating(env: Env, fetchImpl: typeof fetch = fetch, timeoutMs = PLACES_TIMEOUT_MS): Promise<GoogleRating> {
  const key = env.GOOGLE_PLACES_API_KEY?.trim();
  const placeId = env.GOOGLE_PLACE_ID_DILSUKHNAGAR?.trim();
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY is not set');
  if (!placeId) throw new Error('GOOGLE_PLACE_ID_DILSUKHNAGAR is not set');

  let res: Response;
  try {
    res = await fetchImpl(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri' },
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    throw new Error(name === 'TimeoutError' || name === 'AbortError' ? `Places API timed out after ${timeoutMs} ms` : `Places API request failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (res.status !== 200) throw new Error(`Places API HTTP ${res.status}`);

  let body: { rating?: unknown; userRatingCount?: unknown; googleMapsUri?: unknown };
  try {
    body = await res.json();
  } catch {
    throw new Error('Places API returned invalid JSON');
  }
  const { rating, userRatingCount, googleMapsUri } = body;
  if (typeof rating !== 'number' || !Number.isFinite(rating) || rating < 1 || rating > 5) throw new Error(`Places API: bad rating ${JSON.stringify(rating)}`);
  if (typeof userRatingCount !== 'number' || !Number.isInteger(userRatingCount) || userRatingCount < 1) throw new Error(`Places API: bad userRatingCount ${JSON.stringify(userRatingCount)}`);
  if (typeof googleMapsUri !== 'string' || !MAPS_URI.test(googleMapsUri)) throw new Error(`Places API: no usable googleMapsUri (${JSON.stringify(googleMapsUri)})`);
  return { rating, count: userRatingCount, mapsUri: googleMapsUri };
}

/**
 * Wraps the (cached) loader so callers only ever see a rating or null: never
 * a throw to the page, never a broken build. Each distinct failure is logged once.
 */
export function ratingGetter(load: () => Promise<GoogleRating>, log: (msg: string) => void = (m) => console.warn(m)): () => Promise<GoogleRating | null> {
  const logged = new Set<string>();
  return async () => {
    try {
      return await load();
    } catch (err) {
      const msg = `[google-rating] hidden: ${err instanceof Error ? err.message : String(err)}`;
      if (!logged.has(msg)) {
        logged.add(msg);
        log(msg);
      }
      return null;
    }
  };
}

/** "★ 4.7/5 on Google (1,234 reviews)" — one decimal, Indian digit grouping. */
export function ratingLabel(r: Pick<GoogleRating, 'rating' | 'count'>): string {
  return `★ ${r.rating.toFixed(1)}/5 on Google (${r.count.toLocaleString('en-IN')} ${r.count === 1 ? 'review' : 'reviews'})`;
}

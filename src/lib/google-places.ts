/**
 * Google Places API (New) Place Details: the live rating and opening hours for one listing.
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
  /** Opening hours from the same listing; null when Google has none or they don't parse. */
  hours: PlaceHours | null;
}

/** Opening hours as the Google Business Profile lists them. */
export interface PlaceHours {
  /** Google's own text, one line per day, Monday first: "Monday: 7:00 AM – 9:00 PM". */
  weekdayDescriptions: string[];
  /** For schema.org openingHoursSpecification: day name, "HH:MM" opens/closes. */
  periods: Array<{ day: SchemaDay; opens: string; closes: string }>;
}

const SCHEMA_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export type SchemaDay = (typeof SCHEMA_DAYS)[number];

const hhmm = (p: unknown): string | null => {
  const { hour, minute } = (p ?? {}) as { hour?: unknown; minute?: unknown };
  const h = typeof hour === 'number' ? hour : 0;
  const m = typeof minute === 'number' ? minute : 0;
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 24 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * regularOpeningHours from Places (New). Lenient: anything unexpected gives
 * null, so a hours problem can never hide the rating. A period without a
 * close (open 24 hours) closes at 23:59.
 */
export function parsePlaceHours(raw: unknown): PlaceHours | null {
  const { weekdayDescriptions, periods } = (raw ?? {}) as { weekdayDescriptions?: unknown; periods?: unknown };
  if (!Array.isArray(weekdayDescriptions) || weekdayDescriptions.length !== 7 || !weekdayDescriptions.every((d) => typeof d === 'string' && d.trim())) return null;
  if (!Array.isArray(periods) || periods.length === 0) return null;
  const out: PlaceHours['periods'] = [];
  for (const p of periods as Array<{ open?: { day?: unknown }; close?: unknown }>) {
    const day = p?.open?.day;
    if (typeof day !== 'number' || !Number.isInteger(day) || day < 0 || day > 6) return null;
    const opens = hhmm(p.open);
    const closes = p.close === undefined ? '23:59' : hhmm(p.close);
    if (!opens || !closes) return null;
    out.push({ day: SCHEMA_DAYS[day], opens, closes });
  }
  return { weekdayDescriptions: weekdayDescriptions.map((d: string) => d.trim()), periods: out };
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
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,regularOpeningHours' },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (isNextInternalError(err)) throw err;
    const name = err instanceof Error ? err.name : '';
    throw new Error(name === 'TimeoutError' || name === 'AbortError' ? `Places API timed out after ${timeoutMs} ms` : `Places API request failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!res.ok || res.status !== 200) throw new Error(`Places API HTTP ${res.status}`);

  let body: { rating?: unknown; userRatingCount?: unknown; googleMapsUri?: unknown; regularOpeningHours?: unknown };
  try {
    body = await res.json();
  } catch {
    throw new Error('Places API returned invalid JSON');
  }
  const { rating, userRatingCount, googleMapsUri } = body;
  if (typeof rating !== 'number' || !Number.isFinite(rating) || rating < 1 || rating > 5) throw new Error('Places API: rating missing or out of range');
  if (typeof userRatingCount !== 'number' || !Number.isInteger(userRatingCount) || userRatingCount < 1) throw new Error('Places API: userRatingCount missing or invalid');
  if (typeof googleMapsUri !== 'string' || !MAPS_URI.test(googleMapsUri)) throw new Error('Places API: googleMapsUri missing or not a Google Maps link');
  return { rating, count: userRatingCount, mapsUri: googleMapsUri, hours: parsePlaceHours(body.regularOpeningHours) };
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

/** How long this process stops calling Google after a failed Places call. */
export const FAILURE_PAUSE_MS = 10 * 60 * 1000;

/**
 * After an ordinary failure, this process makes no Places call for
 * FAILURE_PAUSE_MS: calls fail fast instead (rating hidden). Meant to run
 * INSIDE the unstable_cache callback, so a cached success is still served
 * during a pause (the callback only runs on a cache miss) and a paused call
 * throws, so nothing is ever written to the 24 h entry. In memory, per
 * process: a new deploy or cold start begins unpaused. Next.js internals
 * don't trigger a pause.
 */
export function pauseAfterFailure<T>(
  fn: () => Promise<T>,
  opts: { pauseMs?: number; now?: () => number; isInternal?: (err: unknown) => boolean } = {},
): () => Promise<T> {
  const pauseMs = opts.pauseMs ?? FAILURE_PAUSE_MS;
  const now = opts.now ?? Date.now;
  const isInternal = opts.isInternal ?? isNextInternalError;
  let pausedUntil = 0;
  let reason = '';
  return async () => {
    // Constant message for the whole pause, so it's logged once.
    if (now() < pausedUntil) throw new Error(`Places API paused for ${Math.round(pauseMs / 60_000)} min after a failure (${reason})`);
    try {
      return await fn();
    } catch (err) {
      if (!isInternal(err)) {
        pausedUntil = now() + pauseMs;
        reason = err instanceof Error ? err.message : String(err);
      }
      throw err;
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

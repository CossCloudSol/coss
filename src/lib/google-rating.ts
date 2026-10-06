import 'server-only';
import { unstable_cache } from 'next/cache';
import { isDynamicServerError } from 'next/dist/client/components/hooks-server-context';
import { isDynamicUsageError } from 'next/dist/export/helpers/is-dynamic-usage-error';
import { dedupeInFlight, fetchPlaceRating, isNextInternalError, pauseAfterFailure, ratingGetter, type GoogleRating } from '@/lib/google-places';

export type { GoogleRating };

/**
 * Live Google rating and opening hours for the Dilsukhnagar listing (Places API (New),
 * GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID_DILSUKHNAGAR, server-only).
 *
 * Only successes are cached (revalidate 86400 s, tag 'google-rating'): the
 * cached function THROWS on a missing env var, non-OK response, network error,
 * timeout (5 s) or bad data, and unstable_cache doesn't store a rejected call,
 * so a failure is retried on the next render instead of being kept for 24 h.
 * Outside the cache an ordinary failure becomes null (rating hidden; one
 * console.warn line per process, no key, no URL). Next.js internals
 * (DYNAMIC_SERVER_USAGE etc.) are rethrown, never swallowed.
 *
 * After a failed Places call this process pauses Google calls for 10 min
 * (pauseAfterFailure, in memory, inside the cached callback): a cached
 * success is still served, and nothing is written to the cache.
 *
 * Every caller hides its rating UI on null, and shows it only with "on
 * Google" and a link to mapsUri (Google's attribution rule). Never
 * hard-code a rating; no Review/AggregateRating schema anywhere.
 */
const isNextInternal = (err: unknown) => isDynamicServerError(err) || isDynamicUsageError(err) || isNextInternalError(err);

// Runs only on a cache miss; throws while paused (never cached).
const loadFromGoogle = pauseAfterFailure(() => fetchPlaceRating(process.env), { isInternal: isNextInternal });

const loadCached = unstable_cache(loadFromGoogle, ['google-place-dilsukhnagar-v2'] /* v2: + opening hours; the old entry lacks them */, {
  revalidate: 86_400,
  tags: ['google-rating'],
});

// Concurrent renders in one worker process share one request.
export const getGoogleRating: () => Promise<GoogleRating | null> = ratingGetter(dedupeInFlight(loadCached), { isInternal: isNextInternal });

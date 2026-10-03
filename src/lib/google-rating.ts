import 'server-only';
import { unstable_cache } from 'next/cache';
import { fetchPlaceRating, ratingGetter, type GoogleRating } from '@/lib/google-places';

export type { GoogleRating };

/**
 * Live Google rating for the Dilsukhnagar listing (Places API (New),
 * GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID_DILSUKHNAGAR, server-only).
 *
 * Only successes are cached: fetchPlaceRating throws on a missing env var,
 * non-200, timeout or bad data, and unstable_cache doesn't store a rejected
 * call, so a failure is retried on the next render instead of being kept
 * for 24 h. Outside the cache the error becomes null (logged once), so it
 * never throws to the page and never breaks the build.
 *
 * Every caller hides its rating UI on null, and shows it only with "on
 * Google" and a link to mapsUri (Google's attribution rule). Never
 * hard-code a rating; no Review/AggregateRating schema anywhere.
 */
const loadCached = unstable_cache(() => fetchPlaceRating(process.env), ['google-rating-dilsukhnagar'], {
  revalidate: 86_400,
  tags: ['google-rating'],
});

export const getGoogleRating: () => Promise<GoogleRating | null> = ratingGetter(loadCached);

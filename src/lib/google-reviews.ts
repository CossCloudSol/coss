import 'server-only';
import { unstable_cache } from 'next/cache';
import { isDynamicServerError } from 'next/dist/client/components/hooks-server-context';
import { isDynamicUsageError } from 'next/dist/export/helpers/is-dynamic-usage-error';
import { dedupeInFlight, fetchPlaceReviews, isNextInternalError, pauseAfterFailure, ratingGetter, type GoogleReviews } from '@/lib/google-places';

export type { GoogleReview, GoogleReviews } from '@/lib/google-places';

/**
 * Live Google reviews for the Dilsukhnagar listing (Places API (New), server-only), for the
 * homepage review block. Same rules as the rating (google-rating.ts): only successes are cached
 * (24 h, tag 'google-rating'), a failure throws and is retried on the next render, a failed call
 * pauses Google calls in this process for 10 min, and an ordinary failure becomes null, which
 * hides the block. Testimonial rows from the admin are never used as a fallback.
 */
const isNextInternal = (err: unknown) => isDynamicServerError(err) || isDynamicUsageError(err) || isNextInternalError(err);

const loadFromGoogle = pauseAfterFailure(() => fetchPlaceReviews(process.env), { isInternal: isNextInternal });

const loadCached = unstable_cache(loadFromGoogle, ['google-reviews-dilsukhnagar-v1'], {
  revalidate: 86_400,
  tags: ['google-rating'],
});

export const getGoogleReviews: () => Promise<GoogleReviews | null> = ratingGetter<GoogleReviews>(dedupeInFlight(loadCached), { isInternal: isNextInternal });

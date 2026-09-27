/**
 * Live Google rating for the Dilsukhnagar listing.
 *
 * Returns null until the Places API integration (queue item Q5) is built and
 * GOOGLE_PLACES_API_KEY / GOOGLE_PLACE_ID_DILSUKHNAGAR are configured. Every
 * caller must hide its rating UI on null. Never hard-code a rating here or
 * anywhere else: a rating may only come live from Google.
 */
export interface GoogleRating {
  /** Average rating, e.g. 4.7. */
  rating: number;
  /** Number of Google reviews behind the average. */
  count: number;
}

export async function getGoogleRating(): Promise<GoogleRating | null> {
  return null;
}

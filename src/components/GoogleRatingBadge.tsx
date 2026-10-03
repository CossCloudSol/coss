import { ratingLabel, type GoogleRating } from '@/lib/google-places';

/**
 * "★ {rating}/5 on Google ({count} reviews)", linked to the Google Maps listing.
 * Renders nothing without a live rating or without the attribution link
 * (Google requires both "on Google" and a link to the listing). Kept apart
 * from "5,000+ students trained": that's our number, this is Google's.
 */
export default function GoogleRatingBadge({ rating, className, style }: { rating: GoogleRating | null; className?: string; style?: React.CSSProperties }) {
  if (!rating?.mapsUri) return null;
  return (
    <a href={rating.mapsUri} target="_blank" rel="noopener noreferrer" className={className} style={style} data-google-rating="">
      {ratingLabel(rating)}
    </a>
  );
}

/**
 * Course badges are free text in the admin, so a badge can carry a claim the
 * site must not show ("Bestseller", "#1", "100% Placement"). Every public
 * render goes through publicBadge(); a disallowed badge is not shown (card
 * grids fall back to their default label instead).
 */
export const DISALLOWED_BADGE = /placement|guarant|best\s*-?\s*sell|rank|#\s*1\b|\bno\.?\s*1\b|\btop\b|\bleading\b|trusted/i;

/** "High demand" is not an allowed claim; the admin value (and any already saved) shows as "Popular". */
const DEMAND_BADGE = /high\s*-?\s*demand/i;

/** The badge to show publicly, or null when it's empty or disallowed. */
export function publicBadge(badge: string | null | undefined): string | null {
  const b = badge?.trim();
  if (!b || DISALLOWED_BADGE.test(b)) return null;
  return DEMAND_BADGE.test(b) ? 'Popular' : b;
}

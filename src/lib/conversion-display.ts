/**
 * Below this many leads in the denominator, a percentage is misleading (one
 * lead flips it by double digits), so callers show a plain "N of M" count
 * instead.
 */
export const MIN_SAMPLE_FOR_PERCENT = 20;

export function conversionDisplay(
  enrolled: number,
  total: number,
  ratePercent: number,
): string {
  if (total < MIN_SAMPLE_FOR_PERCENT) {
    return `${enrolled} of ${total} lead${total === 1 ? '' : 's'} enrolled`;
  }
  return `${ratePercent.toFixed(1)}%`;
}

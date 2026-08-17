/**
 * Below this many leads in the denominator, a percentage is misleading (one
 * lead flips it by double digits), so callers show a plain "N of M" count
 * instead.
 */
export const MIN_SAMPLE_FOR_PERCENT = 20;

/**
 * @param noun singular noun for the denominator, e.g. "lead" or "click"
 * @param suffix optional trailing phrase, e.g. "enrolled" — omit for a bare count
 */
export function conversionDisplay(
  numerator: number,
  denominator: number,
  ratePercent: number,
  noun: string,
  suffix: string = '',
): string {
  if (denominator < MIN_SAMPLE_FOR_PERCENT) {
    const plural = denominator === 1 ? '' : 's';
    return suffix
      ? `${numerator} of ${denominator} ${noun}${plural} ${suffix}`
      : `${numerator} of ${denominator} ${noun}${plural}`;
  }
  return `${ratePercent.toFixed(1)}%`;
}

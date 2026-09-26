import type { PromoBanner } from '@/lib/promo-banner-schema';

/** Grid banners go after every Nth item. */
export const PROMO_EVERY_N_ITEMS = 6;

/** Banner for the Nth slot on a page, cycling through the admin's banners; null means the fallback card. */
export function bannerForSlot(banners: PromoBanner[], slotIndex: number): PromoBanner | null {
  return banners.length > 0 ? banners[slotIndex % banners.length] : null;
}

/**
 * Splits article HTML so a banner can sit "after the 2nd section": just
 * before the 3rd <h2>. With fewer than three <h2>s the banner goes after the
 * whole body.
 */
export function splitAfterSecondSection(html: string): [string, string] {
  const re = /<h2[\s>]/gi;
  let count = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    count += 1;
    if (count === 3) return [html.slice(0, match.index), html.slice(match.index)];
  }
  return [html, ''];
}

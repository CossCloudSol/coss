import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import { ANNOUNCEMENT_BAR_DEFAULTS, fromDbRow } from '@/lib/validations/announcement-bar';
import { DEPLOY_CACHE_KEY } from '@/lib/deploy-cache-key';

/**
 * What the header's top strip needs. The wording is fixed in the component
 * (allowed claims only); admin → Topbar controls whether the batches message
 * shows and where "See upcoming dates" goes.
 */
export interface TopStripData {
  /** Admin → Topbar "Enabled": shows the batches message. */
  showBatches: boolean;
  /** Admin → Topbar CTA link (defaults to /batches). */
  ctaUrl: string;
}

const getCachedStrip = unstable_cache(
  async (): Promise<TopStripData> => {
    const row = await prisma.announcementBar.findFirst().catch(() => null);
    const config = row ? fromDbRow(row) : ANNOUNCEMENT_BAR_DEFAULTS;
    return { showBatches: config.isEnabled, ctaUrl: config.ctaUrl || '/batches' };
  },
  ['top-strip-v2', DEPLOY_CACHE_KEY],
  { tags: ['announcement-bar'], revalidate: 3600 },
);

export function getTopStripData(): Promise<TopStripData> {
  return getCachedStrip();
}

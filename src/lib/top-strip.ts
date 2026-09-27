import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import { COURSE_CATALOG_TAG } from '@/lib/course-search';
import { getGoogleRating, type GoogleRating } from '@/lib/google-rating';
import { ANNOUNCEMENT_BAR_DEFAULTS, fromDbRow } from '@/lib/validations/announcement-bar';
import { hasLimitedSeats, LIMITED_SEATS_WINDOW_DAYS } from '@/lib/limited-seats';
import { DEPLOY_CACHE_KEY } from '@/lib/deploy-cache-key';

/** What the header's top strip shows. */
export interface TopStripData {
  /** Admin → Topbar "Enabled": shows the batches message. */
  showBatches: boolean;
  /** Admin → Topbar text, e.g. "Upcoming batches filling fast". */
  batchesText: string;
  /** Admin → Topbar CTA, e.g. "See dates" → /batches. */
  ctaLabel: string;
  ctaUrl: string;
  /** True only when a batch starting soon is actually close to full. */
  limitedSeats: boolean;
  /** Live Google rating, or null (then the rating segment is hidden). */
  rating: GoogleRating | null;
}

/**
 * "Limited seats" comes from the admin text only through batch data: any
 * wording like "Limited seats available" in the Topbar text is removed, and
 * the strip adds "· Limited seats" itself when a batch really is filling up.
 */
const LIMITED_SEATS_WORDING = /\s*[-–—·,|]?\s*limited seats(?: available)?[!.]?/gi;

function cleanBatchesText(text: string): string {
  return text.replace(LIMITED_SEATS_WORDING, '').replace(/[\s\-–—·,|]+$/, '').trim();
}

/** Upcoming batches with their seat numbers; the rule itself is in lib/limited-seats (unit-tested). */
async function anyBatchFillingUp(): Promise<boolean> {
  const now = new Date();
  const batches = await prisma.batch.findMany({
    where: { status: 'upcoming', startDate: { gte: now, lte: new Date(now.getTime() + LIMITED_SEATS_WINDOW_DAYS * 86_400_000) } },
    select: { status: true, startDate: true, seatsAvailable: true, totalSeats: true },
  });
  return hasLimitedSeats(batches, now);
}

const getCachedStrip = unstable_cache(
  async (): Promise<Omit<TopStripData, 'rating'>> => {
    const [row, limitedSeats] = await Promise.all([
      prisma.announcementBar.findFirst().catch(() => null),
      anyBatchFillingUp().catch(() => false),
    ]);
    const config = row ? fromDbRow(row) : ANNOUNCEMENT_BAR_DEFAULTS;
    const batchesText = cleanBatchesText(config.announcementText) || 'Upcoming batches filling fast';
    return {
      showBatches: config.isEnabled,
      batchesText,
      ctaLabel: config.ctaLabel,
      ctaUrl: config.ctaUrl,
      limitedSeats,
    };
  },
  ['top-strip', DEPLOY_CACHE_KEY],
  // Topbar saves revalidate 'announcement-bar'; batch writes revalidate the catalogue.
  { tags: ['announcement-bar', COURSE_CATALOG_TAG], revalidate: 3600 },
);

export async function getTopStripData(): Promise<TopStripData> {
  const [strip, rating] = await Promise.all([getCachedStrip(), getGoogleRating().catch(() => null)]);
  return { ...strip, rating };
}

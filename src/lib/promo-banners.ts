import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import { attachmentUrl } from '@/lib/cloudinary';
import { WA_NUMBER } from '@/lib/whatsapp';
import type { SyllabusLink } from '@/components/PromoBanner';
import {
  PROMO_BANNER_BLOCK_TYPE,
  promoBannerMetadataSchema,
  type PromoBanner,
  type PromoBannerPlacement,
} from '@/lib/promo-banner-schema';

/** Revalidated by the admin promo-banner API on every write. */
export const PROMO_BANNERS_TAG = 'promo-banners';

const getCachedVisibleBanners = unstable_cache(
  async (): Promise<PromoBanner[]> => {
    const rows = await prisma.contentBlock.findMany({
      where: { blockType: PROMO_BANNER_BLOCK_TYPE, isVisible: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, metadata: true },
    });
    const banners: PromoBanner[] = [];
    for (const row of rows) {
      // Skip rows whose metadata no longer validates rather than breaking the page.
      const parsed = promoBannerMetadataSchema.safeParse(row.metadata);
      if (parsed.success) banners.push({ id: row.id, ...parsed.data });
    }
    return banners;
  },
  ['promo-banners-visible'],
  { tags: [PROMO_BANNERS_TAG], revalidate: 86400 },
);

/**
 * "Download Syllabus" target for the course-page fallback card: the course's
 * brochure PDF when it has one (the brochure popup's "skip" path already
 * links it directly), otherwise the same WhatsApp syllabus request that
 * brochure delivery uses.
 */
export function syllabusLinkFor(course: { title: string; brochureUrl: string | null }): SyllabusLink {
  if (course.brochureUrl) return { href: attachmentUrl(course.brochureUrl), external: true };
  const message = `Hi, please send me the syllabus for ${course.title}`;
  return { href: `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`, external: true };
}

/**
 * Visible banners for one placement, in admin order. An empty array means
 * the coded fallback card is shown instead. Never throws: a DB error also
 * falls back.
 */
export async function getPromoBanners(placement: PromoBannerPlacement): Promise<PromoBanner[]> {
  try {
    return (await getCachedVisibleBanners()).filter((b) => b.placement === placement);
  } catch (err) {
    console.error('[promo-banners] load failed, using fallback card:', err);
    return [];
  }
}

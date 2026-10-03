import { prisma } from '@/lib/db';
import { CATEGORY_SLUG_MAP } from '@/lib/course-url';
import { courseCanonicalUrl } from '@/lib/course-canonical';
import { courseOgImages, instagramBannerPath } from '@/lib/course-banner-sign';
import type { ChannelContext } from '@/lib/social-captions';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

export type SocialPostCourse = ChannelContext & {
  courseId: string;
  category: string;
  /** What Facebook/LinkedIn show for the course link: its og:image. */
  ogImageUrl: string | null;
};

/**
 * The course a social post promotes, with everything the channels need:
 * page URL (Facebook link), og:image (link card preview) and the Instagram
 * portrait banner carrying the post's hook. Null when the course is gone or
 * unpublished. DB errors propagate (the caller retries or reports them).
 */
export async function getSocialPostCourse(courseId: string, hook: string | null): Promise<SocialPostCourse | null> {
  const c = await prisma.course.findFirst({
    where: { id: courseId, status: 'published' },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      categorySlug: true,
      urlType: true,
      thumbnail: true,
      courseCategory: { select: { slug: true, name: true } },
    },
  });
  if (!c) return null;

  const categorySlug = c.courseCategory?.slug ?? c.categorySlug ?? CATEGORY_SLUG_MAP[c.category] ?? null;
  const category = c.courseCategory?.name ?? c.category;
  const banner = { slug: c.slug, title: c.title, category, categorySlug };
  const [og] = await courseOgImages({ ...banner, thumbnail: c.thumbnail }, SITE_URL);
  const igPath = hook?.trim() ? await instagramBannerPath(banner, hook) : null;

  return {
    courseId: c.id,
    courseSlug: c.slug,
    courseTitle: c.title.trim(),
    category,
    // The course's canonical URL: a same-slug flat landing page beats the
    // /courses duplicate (the 3 Oct post linked the non-canonical duplicate).
    courseUrl: courseCanonicalUrl(c),
    ogImageUrl: og?.url ?? null,
    igImageUrl: igPath ? `${SITE_URL}${igPath}` : null,
  };
}

import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import { CATEGORY_SLUG_MAP } from '@/lib/course-url';
import { syllabusLinkFor } from '@/lib/promo-banners';
import { memoDuringBuild } from '@/lib/build-memo';
import { courseBannerPath } from '@/lib/course-banner-sign';
import { DEPLOY_CACHE_KEY } from '@/lib/deploy-cache-key';
import { COURSE_CATALOG_TAG, parseMonths, slugKeywords, tabForCategory, type CatalogCourse, type SearchIndex } from '@/lib/course-search';
import { publicBadge } from '@/lib/course-badge';
import { courseCanonicalPath } from '@/lib/course-canonical';

// next/image only optimises this Cloudinary folder (next.config.mjs images.remotePatterns).
const OPTIMISABLE_IMAGE = /^https:\/\/res\.cloudinary\.com\/dfditihuw\//;

function todayMidnightIST(): Date {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(Date.now() + istOffset);
  return new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate()) - istOffset);
}

/**
 * Where a course can be taken, for the /courses "How you learn" filter.
 * Online: the course mode says online/hybrid, or an online batch is scheduled.
 * A branch: the course runs in a classroom and either has a batch scheduled
 * at that branch or has no branch batches scheduled yet (runs at both).
 */
function courseModes(mode: string, batches: Array<{ mode: string; centre: string | null }>): string[] {
  const modes: string[] = [];
  if (/online|hybrid/i.test(mode) || batches.some((b) => /online/i.test(b.mode))) modes.push('online');
  if (/classroom|hybrid|offline/i.test(mode)) {
    const centres = batches.map((b) => (b.centre ?? '').toLowerCase()).filter(Boolean);
    for (const branch of ['dilsukhnagar', 'ameerpet']) {
      if (centres.length === 0 || centres.some((c) => c.includes(branch))) modes.push(branch);
    }
  }
  return modes;
}

async function loadSearchIndex(): Promise<SearchIndex> {
  const [courses, categories] = await Promise.all([
    prisma.course.findMany({
      where: { status: 'published' },
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        categorySlug: true,
        urlType: true,
        duration: true,
        level: true,
        mode: true,
        badge: true,
        thumbnail: true,
        brochureUrl: true,
        tools: true,
        featured: true,
        courseCategory: { select: { slug: true, name: true } },
        batches: {
          where: { status: { in: ['upcoming', 'ongoing'] }, startDate: { gte: todayMidnightIST() } },
          orderBy: { startDate: 'asc' },
          select: { startDate: true, mode: true, centre: true },
        },
      },
    }),
    prisma.courseCategory.findMany({
      where: { status: 'published' },
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, name: true },
    }),
  ]);

  const catalog: CatalogCourse[] = await Promise.all(courses.map(async (c, rank): Promise<CatalogCourse> => {
    const categorySlug = c.courseCategory?.slug ?? c.categorySlug ?? CATEGORY_SLUG_MAP[c.category] ?? null;
    const badge = c.badge?.trim() || null;
    const thumbnail = c.thumbnail && OPTIMISABLE_IMAGE.test(c.thumbnail) ? c.thumbnail : null;
    const category = c.courseCategory?.name ?? c.category;
    return {
      id: c.id,
      slug: c.slug,
      title: c.title.trim(),
      url: courseCanonicalPath(c),
      category,
      categorySlug,
      tab: tabForCategory(categorySlug),
      keywords: Array.from(new Set([...c.tools.map((k) => k.toLowerCase().trim()), ...slugKeywords(c.slug)].filter(Boolean))),
      duration: c.duration.trim(),
      months: parseMonths(c.duration),
      level: c.level.trim(),
      mode: c.mode.trim(),
      modes: courseModes(c.mode, c.batches),
      nextBatch: c.batches[0]?.startDate.toISOString() ?? null,
      featured: c.featured,
      rank,
      thumbnail,
      // Admin thumbnail first; otherwise the generated, category-branded banner.
      banner: thumbnail ? null : await courseBannerPath({ slug: c.slug, title: c.title, category, categorySlug }),
      badge: publicBadge(badge),
      syllabusHref: syllabusLinkFor(c).href,
    };
  }));

  const counts = new Map<string, number>();
  for (const c of catalog) if (c.categorySlug) counts.set(c.categorySlug, (counts.get(c.categorySlug) ?? 0) + 1);

  return {
    courses: catalog,
    categories: categories
      .filter((cat) => counts.has(cat.slug))
      .map((cat) => ({ slug: cat.slug, name: cat.name, count: counts.get(cat.slug) ?? 0 })),
  };
}

// Revalidated by every course and batch write (revalidatePaths → COURSE_CATALOG_TAG)
// and by category writes ('categories').
const getCachedSearchIndex = unstable_cache(loadSearchIndex, ['course-search-index', DEPLOY_CACHE_KEY], {
  tags: [COURSE_CATALOG_TAG, 'categories'],
  revalidate: 86400,
});

/**
 * Published course catalogue: the search index, /courses, the homepage cards
 * and the header's Explore Courses menu all read this one cached query.
 */
export function getSearchIndex(): Promise<SearchIndex> {
  return memoDuringBuild('course-search-index', getCachedSearchIndex);
}

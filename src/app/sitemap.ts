/**
 * src/app/sitemap.ts
 *
 * Generates the full XML sitemap for cosscloudsol.com.
 * Covers eight groups:
 *   1. 36 SEO course pages  (from all-pages-registry.ts  → COURSE_PAGES)
 *   2. Category overview pages (from all-pages-registry.ts → CATEGORY_PAGES)
 *   3. Dynamic course pages (from courses-data.ts         → COURSES)
 *   4. Static site pages    (from all-pages-registry.ts  → STATIC_PAGES)
 *   5. Blog posts           (from content/posts via getAllPosts)
 *   6. DB courses at their getCourseUrl() canonical, excluding the ones already
 *      covered by group 1's flat-legacy SLUG_MAP pages (from database)
 *   7. DB category pages    (new categories not in CATEGORY_PAGES)
 *   8. DB blog posts        (published posts from admin panel)
 */

import type { MetadataRoute } from 'next';
import { COURSES } from '@/data/courses-data';
import { COURSE_PAGES, CATEGORY_PAGES, STATIC_PAGES } from '@/lib/all-pages-registry';
import { getAllPosts } from '@/lib/posts';
import { getCourseUrl } from '@/lib/course-url';
import { SLUG_MAP } from '@/lib/get-landing-page-data';
import { NESTED_CANONICAL_OVERRIDES } from '@/app/[courseSlug]/page';

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── DB overrides ───────────────────────────────────────────────────────────
  let pageSeoDB: Array<{
    pageSlug: string
    sitemapInclude: boolean
    sitemapPriority: number
    changeFreq: string
    updatedAt: Date
  }> = []

  try {
    const { prisma } = await import('@/lib/db')
    pageSeoDB = await prisma.pageSeo.findMany({
      select: {
        pageSlug: true,
        sitemapInclude: true,
        sitemapPriority: true,
        changeFreq: true,
        updatedAt: true,
      },
    })
  } catch {
    // DB unavailable — use hardcoded defaults
  }

  function getDbOverride(slug: string) {
    const normalized = slug === '' ? '/' : slug
    return pageSeoDB.find(p => {
      const d = p.pageSlug
      return (
        d === slug ||
        d === normalized ||
        d === `/${slug}` ||
        `/${d}` === slug ||
        d === `/${normalized}` ||
        `/${d}` === normalized
      )
    })
  }

  function isExcluded(slug: string): boolean {
    const override = getDbOverride(slug)
    return override ? !override.sitemapInclude : false
  }

  // 1 ── 36 SEO course pages (/big-data-training-institute-in-hyderabad etc.)
  // lastModified: sourced from the admin PageSeo row's updatedAt when one is
  // tracked for this slug; omitted entirely otherwise (these are hardcoded
  // TS-registry pages with no inherent "last changed" timestamp — fabricating
  // one is worse than leaving lastmod out).
  const seoPageEntries: MetadataRoute.Sitemap = COURSE_PAGES
    .filter((page) => !isExcluded(page.slug))
    .map((page) => {
      const db = getDbOverride(page.slug)
      return {
        url: `${BASE_URL}/${page.slug}`,
        ...(db?.updatedAt ? { lastModified: db.updatedAt } : {}),
        changeFrequency: (db?.changeFreq ?? 'monthly') as MetadataRoute.Sitemap[0]['changeFrequency'],
        priority: db?.sitemapPriority ?? page.priority ?? 0.85,
      }
    })

  // 2 ── Category overview pages (/courses/cloud-computing, /data-analytics-bi etc.)
  const categoryEntries: MetadataRoute.Sitemap = CATEGORY_PAGES
    .filter((page) => !isExcluded(page.slug))
    .map((page) => {
      const db = getDbOverride(page.slug)
      return {
        url: `${BASE_URL}/${page.slug}`,
        ...(db?.updatedAt ? { lastModified: db.updatedAt } : {}),
        changeFrequency: (db?.changeFreq ?? 'monthly') as MetadataRoute.Sitemap[0]['changeFrequency'],
        priority: db?.sitemapPriority ?? page.priority ?? 0.85,
      }
    })

  // 3 ── Dynamic [courseSlug] pages (/devops-training-institute-in-hyderabad etc.)
  const dynamicCourseEntries: MetadataRoute.Sitemap = COURSES
    .filter((course) => !isExcluded(course.slug))
    .map((course) => {
      const db = getDbOverride(course.slug)
      return {
        url: `${BASE_URL}/${course.slug}`,
        ...(db?.updatedAt ? { lastModified: db.updatedAt } : {}),
        changeFrequency: (db?.changeFreq ?? 'monthly') as MetadataRoute.Sitemap[0]['changeFrequency'],
        priority: db?.sitemapPriority ?? 0.8,
      }
    })

  // Dedup: some slugs exist in both COURSE_PAGES (group 1) and COURSES (group 3),
  // which otherwise emit duplicate <loc> entries. Keep the first occurrence (COURSE_PAGES wins).
  const seoPageUrls = new Set(seoPageEntries.map((entry) => entry.url));
  const dynamicCourseEntriesDeduped = dynamicCourseEntries.filter(
    (entry) => !seoPageUrls.has(entry.url)
  );

  // 4 -- Static pages (home, courses, about, contact, etc.)
  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES
    .filter((page) => !isExcluded(page.slug))
    .map((page) => {
      const db = getDbOverride(page.slug)
      return {
        url: `${BASE_URL}/${page.slug}`,
        ...(db?.updatedAt ? { lastModified: db.updatedAt } : {}),
        changeFrequency: (db?.changeFreq ?? page.changeFrequency) as MetadataRoute.Sitemap[0]['changeFrequency'],
        priority: db?.sitemapPriority ?? page.priority,
      }
    })

  // 5 -- Blog posts (dynamic, from content/posts)
  // lastModified: the admin PageSeo updatedAt wins if tracked; otherwise the
  // source .mdx file's real filesystem mtime — NOT post.frontmatter.date,
  // which getAllPosts() synthesizes as an evenly-spread fake publish date
  // (see src/lib/posts.ts) and is not an honest "last changed" signal.
  let blogEntries: MetadataRoute.Sitemap = [];
  const fsBlogSlugs = new Set<string>();
  try {
    const posts = await getAllPosts();
    blogEntries = posts
      .filter((post) => !isExcluded(`blog/${post.slug}`))
      .map((post) => {
        const db = getDbOverride(`blog/${post.slug}`)
        fsBlogSlugs.add(post.slug);
        return {
          url: `${BASE_URL}/blog/${post.slug}`,
          ...(db?.updatedAt || post.fileMtime
            ? { lastModified: db?.updatedAt ?? post.fileMtime }
            : {}),
          changeFrequency: (db?.changeFreq ?? 'monthly') as MetadataRoute.Sitemap[0]['changeFrequency'],
          priority: db?.sitemapPriority ?? 0.7,
        }
      })
  } catch {
    // getAllPosts failed (e.g. no content dir in CI) — skip blog entries
  }

  // 6 ── All DB courses at their canonical URLs (/courses/{slug} or /courses/{cat}/{slug})
  let dbCourseEntries: MetadataRoute.Sitemap = [];
  // 7 ── DB category pages not already in CATEGORY_PAGES
  let dbCategoryEntries: MetadataRoute.Sitemap = [];
  // 8 ── Published DB blog posts not already in FS blog entries
  let dbBlogEntries: MetadataRoute.Sitemap = [];

  try {
    const { prisma } = await import('@/lib/db')

    // 6 — DB courses, at their getCourseUrl() canonical only.
    // Courses whose own slug is a SLUG_MAP key are excluded here: that slug is
    // one of the 30 flat-legacy money pages (group 1, self-canonicalizing),
    // and the DB route resolves the exact same row — including both would put
    // two sitemap entries for identical content. Exception: a course on the
    // NESTED_CANONICAL_OVERRIDES allowlist has a nested canonical that
    // *differs* from its flat URL, so it must still get its own group-6 entry.
    const dbCourses = await prisma.course.findMany({
      where: { status: 'published' },
      select: { slug: true, urlType: true, categorySlug: true, updatedAt: true },
    })
    dbCourseEntries = dbCourses
      .filter((course) => !(course.slug in SLUG_MAP) || course.slug in NESTED_CANONICAL_OVERRIDES)
      .map((course) => {
        const db = getDbOverride(course.slug)
        return {
          url: `${BASE_URL}${getCourseUrl(course)}`,
          lastModified: course.updatedAt,
          changeFrequency: (db?.changeFreq ?? 'monthly') as MetadataRoute.Sitemap[0]['changeFrequency'],
          priority: db?.sitemapPriority ?? 0.75,
        }
      })
      .filter((entry) => !isExcluded(entry.url.replace(BASE_URL, '')))

    // 7 — DB categories not already registered in CATEGORY_PAGES
    const existingCategorySlugs = new Set(CATEGORY_PAGES.map((p) => p.slug))
    const dbCategories = await prisma.courseCategory.findMany({
      select: { slug: true, updatedAt: true },
    })
    dbCategoryEntries = dbCategories
      .filter((cat) => !existingCategorySlugs.has(`courses/${cat.slug}`))
      .filter((cat) => !isExcluded(`courses/${cat.slug}`))
      .map((cat) => ({
        url: `${BASE_URL}/courses/${cat.slug}`,
        lastModified: cat.updatedAt,
        changeFrequency: 'monthly' as MetadataRoute.Sitemap[0]['changeFrequency'],
        priority: 0.8,
      }))

    // 8 — Published DB blog posts not already covered by FS blog entries
    const dbPosts = await prisma.blogPost.findMany({
      where: { status: 'published' },
      select: { slug: true, publishedAt: true, updatedAt: true },
    })
    dbBlogEntries = dbPosts
      .filter((post) => post.slug.length > 1 && !fsBlogSlugs.has(post.slug))
      .filter((post) => !isExcluded(`blog/${post.slug}`))
      .map((post) => {
        const db = getDbOverride(`blog/${post.slug}`)
        return {
          url: `${BASE_URL}/blog/${post.slug}`,
          lastModified: post.publishedAt ?? post.updatedAt,
          changeFrequency: (db?.changeFreq ?? 'monthly') as MetadataRoute.Sitemap[0]['changeFrequency'],
          priority: db?.sitemapPriority ?? 0.7,
        }
      })
  } catch {
    // DB unavailable — skip dynamic entries
  }

  return [
    ...seoPageEntries,
    ...categoryEntries,
    ...dynamicCourseEntriesDeduped,
    ...staticEntries,
    ...blogEntries,
    ...dbCourseEntries,
    ...dbCategoryEntries,
    ...dbBlogEntries,
  ];
}

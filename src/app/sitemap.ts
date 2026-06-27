/**
 * src/app/sitemap.ts
 *
 * Generates the full XML sitemap for cosscloudsol.com.
 * Covers four groups:
 *   1. 36 SEO course pages  (from all-pages-registry.ts  → COURSE_PAGES)
 *   2. Dynamic course pages (from courses-data.ts         → COURSES)
 *   3. Static site pages    (from all-pages-registry.ts  → STATIC_PAGES)
 *   4. Blog posts           (from content/posts via getAllPosts)
 */

import type { MetadataRoute } from 'next';
import { COURSES } from '@/data/courses-data';
import { COURSE_PAGES, CATEGORY_PAGES, STATIC_PAGES } from '@/lib/all-pages-registry';
import { getAllPosts } from '@/lib/posts';

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── DB overrides ───────────────────────────────────────────────────────────
  let pageSeoDB: Array<{
    pageSlug: string
    sitemapInclude: boolean
    sitemapPriority: number
    changeFreq: string
  }> = []

  try {
    const { prisma } = await import('@/lib/db')
    pageSeoDB = await prisma.pageSeo.findMany({
      select: {
        pageSlug: true,
        sitemapInclude: true,
        sitemapPriority: true,
        changeFreq: true,
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
  const seoPageEntries: MetadataRoute.Sitemap = COURSE_PAGES
    .filter((page) => !isExcluded(page.slug))
    .map((page) => {
      const db = getDbOverride(page.slug)
      return {
        url: `${BASE_URL}/${page.slug}`,
        lastModified: now,
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
        lastModified: now,
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
        lastModified: now,
        changeFrequency: (db?.changeFreq ?? 'monthly') as MetadataRoute.Sitemap[0]['changeFrequency'],
        priority: db?.sitemapPriority ?? 0.8,
      }
    })

  // 4 -- Static pages (home, courses, about, contact, etc.)
  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES
    .filter((page) => !isExcluded(page.slug))
    .map((page) => {
      const db = getDbOverride(page.slug)
      return {
        url: `${BASE_URL}/${page.slug}`,
        lastModified: now,
        changeFrequency: (db?.changeFreq ?? page.changeFrequency) as MetadataRoute.Sitemap[0]['changeFrequency'],
        priority: db?.sitemapPriority ?? page.priority,
      }
    })

  // 5 -- Blog posts (dynamic, from content/posts)
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await getAllPosts();
    blogEntries = posts
      .filter((post) => !isExcluded(`blog/${post.slug}`))
      .map((post) => {
        const db = getDbOverride(`blog/${post.slug}`)
        return {
          url: `${BASE_URL}/blog/${post.slug}`,
          lastModified: post.frontmatter.date
            ? new Date(post.frontmatter.date)
            : now,
          changeFrequency: (db?.changeFreq ?? 'monthly') as MetadataRoute.Sitemap[0]['changeFrequency'],
          priority: db?.sitemapPriority ?? 0.7,
        }
      })
  } catch {
    // getAllPosts failed (e.g. no content dir in CI) — skip blog entries
  }

  return [
    ...seoPageEntries,
    ...categoryEntries,
    ...dynamicCourseEntries,
    ...staticEntries,
    ...blogEntries,
  ];
}

import { prisma } from '@/lib/db'
import { memoDuringBuild } from '@/lib/build-memo'
import { SLUG_MAP } from '@/lib/slug-map'

export type LandingPageCourse = {
  id: string
  title: string
  slug: string
  categorySlug: string | null
  description: string
  excerpt: string
  duration: string
  level: string
  price: number | null
  originalPrice: number | null
  thumbnail: string | null
  brochureUrl: string | null
  highlights: string[]
  syllabus: unknown       // Json — may already be parsed object or stringified
  tools: string[]
  category: string
  courseCategory: { name: string; slug: string } | null
}

export { SLUG_MAP }

/**
 * Published course for a flat landing slug, or null when none matches.
 * DB errors propagate on purpose: a swallowed error became a cached 404.
 */
export async function getLandingPageCourse(slug: string): Promise<LandingPageCourse | null> {
  // Check explicit map first
  const mappedSlug = SLUG_MAP[slug]

  // Build variant list — explicit map takes priority
  const variants = Array.from(new Set([
    ...(mappedSlug ? [mappedSlug] : []),
    slug,
    slug.replace(/-training-institute-in-hyderabad$/, '-training-in-hyderabad'),
    slug.replace(/-training-institute-in-hyderabad$/, ''),
    slug.replace(/-institute-in-hyderabad$/, '-in-hyderabad'),
    slug.replace(/-institute-in-hyderabad$/, ''),
    slug.replace(/-training-in-hyderabad$/, ''),
    slug.replace(/-in-hyderabad$/, ''),
  ]))

  // One round trip for all variants, then pick in priority order (explicit
  // SLUG_MAP entry first). A single findFirst({ slug: { in: variants } })
  // would lose that order since SQL IN doesn't preserve array order, letting
  // a regex-fallback variant that matches a different course win instead —
  // so fetch every published match and choose here. This replaces up to 8
  // sequential findFirst calls (all 8 ran for every unknown slug, e.g. bot
  // probes hitting the /[courseSlug] catch-all).
  // Landing pages look each other up as siblings; one query per slug per build worker.
  const matches = await memoDuringBuild(`landing-course:${variants.join('|')}`, () => prisma.course.findMany({
    where: { slug: { in: variants }, status: 'published' },
    select: {
      id: true,
      title: true,
      slug: true,
      categorySlug: true,
      description: true,
      excerpt: true,
      duration: true,
      level: true,
      price: true,
      originalPrice: true,
      thumbnail: true,
      brochureUrl: true,
      highlights: true,
      syllabus: true,
      tools: true,
      category: true,
      courseCategory: { select: { name: true, slug: true } },
    },
  }))
  for (const variant of variants) {
    const course = matches.find((c) => c.slug === variant)
    if (course) return course
  }
  return null
}

// Handles Prisma Json (already parsed), JSON strings, or null gracefully.
export function safeParseJson<T>(json: unknown, fallback: T): T {
  if (json === null || json === undefined) return fallback
  if (Array.isArray(json) || (typeof json === 'object')) return json as T
  if (typeof json === 'string') {
    try { return JSON.parse(json) as T } catch { return fallback }
  }
  return fallback
}

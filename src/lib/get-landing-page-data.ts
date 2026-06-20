import { prisma } from '@/lib/db'

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
  highlights: string[]
  syllabus: unknown       // Json — may already be parsed object or stringified
  tools: string[]
  category: string
  courseCategory: { name: string; slug: string } | null
}

export async function getLandingPageCourse(slug: string): Promise<LandingPageCourse | null> {
  try {
    const variants = Array.from(new Set([
      slug,
      slug.replace(/-training-institute-in-hyderabad$/, '-training-in-hyderabad'),
      slug.replace(/-training-institute-in-hyderabad$/, ''),
      slug.replace(/-institute-in-hyderabad$/, '-in-hyderabad'),
      slug.replace(/-institute-in-hyderabad$/, ''),
      slug.replace(/-training-in-hyderabad$/, ''),
      slug.replace(/-in-hyderabad$/, ''),
    ]))

    const course = await prisma.course.findFirst({
      where: {
        slug: { in: variants },
      },
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
        highlights: true,
        syllabus: true,
        tools: true,
        category: true,
        courseCategory: { select: { name: true, slug: true } },
      },
    })
    return course
  } catch {
    return null
  }
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

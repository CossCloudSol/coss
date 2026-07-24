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

// Explicit map: landing page URL slug → DB course slug
export const SLUG_MAP: Record<string, string> = {
      // Already matched — keep working
      'artificial-intelligence-training-institute-in-hyderabad': 'artificial-intelligence-training-institute-in-hyderabad',
      'azure-devops-training-institute-in-hyderabad':           'azure-devops-training-in-hyderabad',
      'cyber-security-training-institute-in-hyderabad':         'cyber-security-training-institute-in-hyderabad',
      'devops-training-institute-in-hyderabad':                 'devops-training-institute-in-hyderabad',
      'digital-marketing-training-institute-in-hyderabad':      'digital-marketing-training-in-hyderabad',
      'ethical-hacking-training-institute-in-hyderabad':        'ethical-hacking-training-institute-in-hyderabad',
      'machine-learning-training-institute-in-hyderabad':       'machine-learning-training-institute-in-hyderabad',
      'power-bi-training-institute-in-hyderabad':               'power-bi-training-in-hyderabad',
      'software-testing-training-institute-in-hyderabad':       'software-testing-training-institute-in-hyderabad',
      'ui-ux-design-training-institute-in-hyderabad':           'ui-ux-design-training-institute-in-hyderabad',

      // Newly mapped — 16 slugs fixed
      'aws-training-institute-in-hyderabad':                    'aws-solutions-architect-training-in-hyderabad',
      'aws-devops-training-institute-in-hyderabad':             'kubernetes-docker-devops-training-in-hyderabad',
      'azure-training-institute-in-hyderabad':                  'azure-administrator-training-in-hyderabad',
      'big-data-training-institute-in-hyderabad':               'apache-spark-training-in-hyderabad',
      'communication-skills-training-in-hyderabad':             'business-communication-english-training-in-hyderabad',
      'data-engineering-training-institute-in-hyderabad':       'data-engineering-python-training-in-hyderabad',
      'google-cloud-training-institute-in-hyderabad':           'google-cloud-engineer-training-in-hyderabad',
      'java-training-institute-in-hyderabad':                   'full-stack-java-developer-training-in-hyderabad',
      'python-training-institute-in-hyderabad':                 'python-programming-training-in-hyderabad',
      'sql-training-institute-in-hyderabad':                    'sql-data-analytics-training-hyderabad',

      // Real slugs — seeded 2026-06-25
      'ms-office-training-institute-in-hyderabad':              'ms-office-advanced-excel',
      'soft-skills-training-institute-in-hyderabad':            'soft-skills-personality-development',
      'spoken-english-training-institute-in-hyderabad':         'spoken-english-communication',
      'tally-erp-training-institute-in-hyderabad':              'tally-erp-prime-accounting',

      // "-institute-" variants missing — GSC 404 remediation 2026-07-16
      'linux-administration-training-institute-in-hyderabad':  'linux-shell-scripting-training-in-hyderabad',
      'azure-data-engineer-training-institute-in-hyderabad':    'azure-data-factory-training-in-hyderabad',
      'ccna-training-institute-in-hyderabad':                   'network-security-training-in-hyderabad',

      // Orphaned sitemap URLs — SEO audit remediation 2026-07-17
      'python-full-stack-training-institute-in-hyderabad':      'full-stack-python-training-in-hyderabad',

      // Fallback-only slugs formalized — flat-legacy consolidation 2026-07-23
      'salesforce-training-institute-in-hyderabad':             'salesforce-training-institute-in-hyderabad',
      'seo-training-institute-in-hyderabad':                    'seo-training-institute-in-hyderabad',
}

export async function getLandingPageCourse(slug: string): Promise<LandingPageCourse | null> {
  try {
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

    // Query variants in priority order (explicit SLUG_MAP entry first) — a single
    // findFirst({ slug: { in: variants } }) would lose that order since SQL IN
    // doesn't preserve array order, letting a regex-fallback variant that
    // happens to match a different (possibly unpublished) course win instead.
    for (const variant of variants) {
      const course = await prisma.course.findFirst({
        where: { slug: variant, status: 'published' },
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
      if (course) return course
    }
    return null
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

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
    // Explicit map: landing page URL slug → DB course slug
    const SLUG_MAP: Record<string, string> = {
      // Already matched — keep working
      'artificial-intelligence-training-institute-in-hyderabad': 'artificial-intelligence-training-institute-in-hyderabad',
      'azure-devops-training-institute-in-hyderabad':           'azure-devops-training-in-hyderabad',
      'cyber-security-training-institute-in-hyderabad':         'cyber-security-training-institute-in-hyderabad',
      'data-analytics-training-institute-in-hyderabad':         'data-analytics-training-institute-in-hyderabad',
      'data-science-training-institute-in-hyderabad':           'data-science-training-institute-in-hyderabad',
      'devops-training-institute-in-hyderabad':                 'devops-training-institute-in-hyderabad',
      'digital-marketing-training-institute-in-hyderabad':      'digital-marketing-training-in-hyderabad',
      'ethical-hacking-training-institute-in-hyderabad':        'ethical-hacking-training-institute-in-hyderabad',
      'machine-learning-training-institute-in-hyderabad':       'machine-learning-training-institute-in-hyderabad',
      'power-bi-training-institute-in-hyderabad':               'power-bi-training-in-hyderabad',
      'software-testing-training-institute-in-hyderabad':       'software-testing-training-institute-in-hyderabad',
      'ui-ux-design-training-institute-in-hyderabad':           'ui-ux-design-training-in-hyderabad',

      // Newly mapped — 16 slugs fixed
      'aws-training-institute-in-hyderabad':                    'aws-solutions-architect-training-in-hyderabad',
      'aws-devops-training-institute-in-hyderabad':             'kubernetes-docker-devops-training-in-hyderabad',
      'azure-training-institute-in-hyderabad':                  'azure-administrator-training-in-hyderabad',
      'azure-data-engineer-training-in-hyderabad':              'azure-data-factory-training-in-hyderabad',
      'big-data-training-institute-in-hyderabad':               'apache-spark-training-in-hyderabad',
      'ccna-networking-training-institute-in-hyderabad':        'network-security-training-in-hyderabad',
      'cloud-computing-training-institute-in-hyderabad':        'multi-cloud-architecture-training-in-hyderabad',
      'cloud-data-engineer-training-in-hyderabad':              'data-engineering-python-training-in-hyderabad',
      'communication-skills-training-in-hyderabad':             'business-communication-training-in-hyderabad',
      'data-engineering-training-institute-in-hyderabad':       'data-engineering-python-training-in-hyderabad',
      'erp-crm-training-institute-in-hyderabad':                'salesforce-admin-developer-training-in-hyderabad',
      'full-stack-developer-training-in-hyderabad':             'full-stack-java-developer-training-in-hyderabad',
      'google-cloud-training-institute-in-hyderabad':           'google-cloud-engineer-training-in-hyderabad',
      'java-training-institute-in-hyderabad':                   'full-stack-java-developer-training-in-hyderabad',
      'linux-administration-training-in-hyderabad':             'linux-shell-scripting-training-in-hyderabad',
      'multi-cloud-engineer-training-in-hyderabad':             'multi-cloud-architecture-training-in-hyderabad',
      'oracle-fusion-hcm-training-in-hyderabad':                'salesforce-admin-developer-training-in-hyderabad',
      'python-training-institute-in-hyderabad':                 'python-programming-training-in-hyderabad',
      'salesforce-crm-training-institute-in-hyderabad':         'salesforce-training-institute-in-hyderabad',
      'sql-training-institute-in-hyderabad':                    'sql-data-analytics-training-hyderabad',

      // Real slugs — seeded 2026-06-25
      'ms-office-training-institute-in-hyderabad':              'ms-office-advanced-excel',
      'soft-skills-training-institute-in-hyderabad':            'soft-skills-personality-development',
      'spoken-english-training-institute-in-hyderabad':         'spoken-english-communication',
      'tally-erp-training-institute-in-hyderabad':              'tally-erp-prime-accounting',

      // "-institute-" variants missing — GSC 404 remediation 2026-07-16
      'aws-cloud-training-institute-in-hyderabad':              'aws-solutions-architect-training-in-hyderabad',
      'cloud-data-engineer-training-institute-in-hyderabad':    'data-engineering-python-training-in-hyderabad',
      'multi-cloud-engineer-training-institute-in-hyderabad':   'multi-cloud-architecture-training-in-hyderabad',
      'linux-administration-training-institute-in-hyderabad':  'linux-shell-scripting-training-in-hyderabad',
      'azure-data-engineer-training-institute-in-hyderabad':    'azure-data-factory-training-in-hyderabad',
      'java-full-stack-training-institute-in-hyderabad':        'full-stack-java-developer-training-in-hyderabad',
      'ccna-training-institute-in-hyderabad':                   'network-security-training-in-hyderabad',
      'oracle-fusion-hcm-training-institute-in-hyderabad':      'salesforce-admin-developer-training-in-hyderabad',
    }

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

    const course = await prisma.course.findFirst({
      where: { slug: { in: variants } },
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

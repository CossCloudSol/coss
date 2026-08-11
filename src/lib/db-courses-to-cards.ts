import type { CourseCardProps } from '@/components/CourseCard'
import { getCourseUrl } from '@/lib/course-url'

const BADGE_MAP: Record<string, string> = {
  'popular': 'Popular',
  'most popular': 'Popular',
  'high demand': 'High Demand',
  'trending': 'Trending',
  'new': 'New',
  'newly added': 'New',
  'bestseller': 'Bestseller',
  'best seller': 'Bestseller',
  'updated 2026': 'Updated',
  'hot': 'Trending',
}

const BADGE_VARIANT_MAP: Record<string, CourseCardProps['badgeVariant']> = {
  'popular': 'orange',
  'most popular': 'orange',
  'high demand': 'rose',
  'trending': 'teal',
  'new': 'green',
  'newly added': 'green',
  'bestseller': 'amber',
  'best seller': 'amber',
  'updated 2026': 'amber',
  'hot': 'teal',
}

const ACCENT_MAP: Record<string, CourseCardProps['accentVariant']> = {
  'data-analytics-bi': 'data',
  'data-engineering': 'data',
  'cyber-security': 'security',
  'erp-crm-enterprise-tools': 'sap',
  'software-testing-os': 'hr',
  'digital-design': 'digital',
  'professional-soft-skills': 'softskills',
  'programming-full-stack': 'fullstack',
  'cloud-computing': 'cloud',
  'devops-multi-cloud': 'devops',
}

interface DbCourse {
  title: string
  slug: string
  duration: string
  mode: string
  level: string
  price: number | null
  originalPrice: number | null
  badge: string | null
  highlights: string[]
  excerpt: string
  urlType: string
  categorySlug: string | null
}

export function dbCoursesToCards(courses: DbCourse[], categorySlug: string): CourseCardProps[] {
  const accentVariant = ACCENT_MAP[categorySlug] ?? 'hr'
  return courses.map((course, i) => {
    const badgeKey = (course.badge ?? '').toLowerCase()
    const raw = course.excerpt.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    const description = raw.length > 120 ? raw.slice(0, 120).trim() + '...' : raw
    return {
      title: course.title,
      badge: BADGE_MAP[badgeKey] ?? 'Popular',
      badgeVariant: BADGE_VARIANT_MAP[badgeKey] ?? 'orange',
      accentVariant,
      duration: course.duration,
      mode: course.mode,
      level: course.level,
      description,
      highlights: [
        course.highlights[0] ?? 'Industry-relevant curriculum',
        course.highlights[1] ?? 'Placement support included',
      ] as [string, string],
      originalPrice: course.originalPrice ? '₹' + course.originalPrice.toLocaleString('en-IN') : '',
      discountedPrice: course.price ? '₹' + course.price.toLocaleString('en-IN') : '',
      emi: 'Easy EMI available',
      urgency: 'Book your free demo class',
      href: getCourseUrl({ urlType: course.urlType, categorySlug: course.categorySlug, slug: course.slug }),
      animationIndex: i,
    }
  })
}

export type CourseUrlType = 'legacy' | 'new'

export interface CourseUrlParams {
  urlType: string
  categorySlug?: string | null
  slug: string
}

// Single source of truth for ALL course URL generation.
// Used by: course cards, sitemap, breadcrumbs, related courses, admin preview.
export function getCourseUrl(course: CourseUrlParams): string {
  if (course.urlType === 'legacy' || !course.categorySlug) {
    return `/courses/${course.slug}`
  }
  return `/courses/${course.categorySlug}/${course.slug}`
}

// Display name → URL slug mapping for the 10 legacy categories.
// Never change these slugs — existing static pages depend on them.
export const CATEGORY_SLUG_MAP: Record<string, string> = {
  'Data, Analytics & BI':        'data-analytics-bi',
  'Cloud Computing':              'cloud-computing',
  'DevOps & Multi-Cloud':        'devops-multi-cloud',
  'Programming & Full Stack':    'programming-full-stack',
  'Data Engineering':             'data-engineering',
  'Cyber Security & Networking': 'cyber-security',
  'ERP, CRM & Enterprise Tools': 'erp-crm-enterprise-tools',
  'Software Testing & OS':       'software-testing-os',
  'Digital & Design':            'digital-design',
  'Professional & Soft Skills':  'professional-soft-skills',
}

export function getCategorySlug(categoryName: string): string {
  if (CATEGORY_SLUG_MAP[categoryName]) {
    return CATEGORY_SLUG_MAP[categoryName]
  }
  return categoryName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function generateCourseSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    + '-in-hyderabad'
}

export function generateBlogSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLandingPageCourse, SLUG_MAP } from '@/lib/get-landing-page-data'
import { getAllBranchSettings } from '@/lib/get-branch-settings'
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo'
import { getRelatedCourses } from '@/lib/related-courses'
import { getFlatSiblingSlugs } from '@/lib/flat-siblings'
import { getFlatCourseUrl } from '@/lib/flat-url'
import LandingPageTemplate from '@/components/LandingPageTemplate'
import type { FlatSiblingLink } from '@/components/LandingPageTemplate'

export const revalidate = 3600

interface Props {
  params: { courseSlug: string }
}

export async function generateStaticParams() {
  return Object.keys(SLUG_MAP).map((courseSlug) => ({ courseSlug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.courseSlug
  const course = await getLandingPageCourse(slug)

  const fallback: Metadata = {
    title: course
      ? `${course.title} Training in Hyderabad | Coss Cloud Solutions`
      : 'IT Training in Hyderabad | Coss Cloud Solutions',
    description:
      course?.excerpt ??
      course?.description ??
      'Best IT training institute in Hyderabad. Hands-on courses with 100% placement support at Dilsukhnagar & Ameerpet.',
    openGraph: course?.thumbnail ? { images: [{ url: course.thumbnail }] } : undefined,
  }

  return buildPageMetadataWithFallback(slug, fallback)
}

export default async function CourseSlugPage({ params }: Props) {
  const [course, branches] = await Promise.all([
    getLandingPageCourse(params.courseSlug),
    getAllBranchSettings(),
  ])

  if (!course) notFound()

  const related = await getRelatedCourses(course.categorySlug, course.id)
  const siblings = await getFlatSiblings(params.courseSlug)

  return (
    <LandingPageTemplate
      course={course}
      branches={branches}
      pageSlug={params.courseSlug}
      related={related}
      siblings={siblings}
    />
  )
}

async function getFlatSiblings(currentSlug: string): Promise<FlatSiblingLink[]> {
  const siblingSlugs = getFlatSiblingSlugs(currentSlug)
  if (siblingSlugs.length === 0) {
    console.warn(`[flat-sibling-strip] pool resolution failed for "${currentSlug}" — rendering nothing`)
    return []
  }

  const siblingCourses = await Promise.all(siblingSlugs.map((slug) => getLandingPageCourse(slug)))
  const siblings: FlatSiblingLink[] = []
  siblingSlugs.forEach((slug, i) => {
    const siblingCourse = siblingCourses[i]
    if (!siblingCourse) {
      console.warn(`[flat-sibling-strip] could not resolve course for sibling slug "${slug}" (page: "${currentSlug}")`)
      return
    }
    siblings.push({ slug, title: siblingCourse.title, href: getFlatCourseUrl(slug) })
  })
  return siblings
}

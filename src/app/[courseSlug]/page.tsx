import { cache } from 'react'
import { courseOgImages } from '@/lib/course-banner-sign';
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLandingPageCourse, SLUG_MAP } from '@/lib/get-landing-page-data'
import { getAllBranchSettings } from '@/lib/get-branch-settings'
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo'
import { appendTrainingInHyderabad } from '@/lib/build-title'
import { getRelatedCourses } from '@/lib/related-courses'
import { getFlatSiblingSlugs } from '@/lib/flat-siblings'
import { getFlatCourseUrl } from '@/lib/flat-url'
import LandingPageTemplate from '@/components/LandingPageTemplate'
import type { FlatSiblingLink } from '@/components/LandingPageTemplate'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com'

export const revalidate = 86400

interface Props {
  params: { courseSlug: string }
}

export async function generateStaticParams() {
  return Object.keys(SLUG_MAP).map((courseSlug) => ({ courseSlug }))
}

// cache() dedupes within a single render pass — generateMetadata and the page
// body both call this with the same params.courseSlug, so this turns two
// Prisma fetches per request into one, matching the other course-URL shapes.
const getCourse = cache(getLandingPageCourse)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.courseSlug
  const course = await getCourse(slug)

  const fallback: Metadata = {
    title: course
      ? `${appendTrainingInHyderabad(course.title)} | Coss Cloud Solutions`
      : 'IT Training in Hyderabad | Coss Cloud Solutions',
    description:
      course?.excerpt ??
      course?.description ??
      'IT training institute in Hyderabad since 2010. Hands-on courses with placement support at Dilsukhnagar & Ameerpet.',
    openGraph: course
      ? {
          images: await courseOgImages(
            { slug: course.slug, title: course.title, category: course.courseCategory?.name ?? course.category, categorySlug: course.courseCategory?.slug ?? course.categorySlug, thumbnail: course.thumbnail },
            SITE_URL,
          ),
        }
      : undefined,
    // A flat landing page is always its own canonical (and og:url). Passed as the
    // computed canonical so a stale PageSeo.canonicalUrl can't point it elsewhere.
    alternates: { canonical: `${SITE_URL}${getFlatCourseUrl(slug)}` },
  }

  return buildPageMetadataWithFallback(slug, fallback)
}

export default async function CourseSlugPage({ params }: Props) {
  const [course, branches] = await Promise.all([
    getCourse(params.courseSlug),
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

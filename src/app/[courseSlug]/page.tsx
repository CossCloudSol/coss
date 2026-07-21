import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLandingPageCourse } from '@/lib/get-landing-page-data'
import { getAllBranchSettings } from '@/lib/get-branch-settings'
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo'
import LandingPageTemplate from '@/components/LandingPageTemplate'

export const revalidate = 3600

interface Props {
  params: { courseSlug: string }
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

  return (
    <LandingPageTemplate
      course={course}
      branches={branches}
      pageSlug={params.courseSlug}
    />
  )
}

import type { Metadata } from 'next';
import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import CoursePageSeo from '@/components/CoursePageSeo';
import CourseCategoryPage from '@/components/CourseCategoryPage';
import { courseData } from '@/lib/courseData';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadataWithFallback('courses/cloud-computing', buildCategoryPageMetadata('courses/cloud-computing'));
}

export default function Page() {
  return (
    <>
      <CoursePageSeo
        slug="courses/cloud-computing"
        title="Best Cloud Computing Training Institute in Hyderabad"
        description="Join the best cloud computing training in Hyderabad. AWS, Azure, Google Cloud, expert trainers, hands-on labs, placement support and certification. Enroll now!"
        category="Cloud Computing"
      />
      <CourseCategoryPage data={courseData['cloud-computing']} breadcrumbSlug="cloud-computing" />
    </>
  );
}

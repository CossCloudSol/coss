import type { Metadata } from 'next';
import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import CoursePageSeo from '@/components/CoursePageSeo';
import CourseCategoryPage from '@/components/CourseCategoryPage';
import { courseData } from '@/lib/courseData';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadataWithFallback('courses/digital-design', buildCategoryPageMetadata('courses/digital-design'));
}

export default function Page() {
  return (
    <>
      <CoursePageSeo
        slug="courses/digital-design"
        title="Best Digital Marketing and Design Training Institute in Hyderabad"
        description="Join the best digital marketing and design training in Hyderabad. SEO, UI/UX, graphic design, expert trainers, placement support and certification. Enroll now!"
        category="Digital & Design"
      />
      <CourseCategoryPage data={courseData['digital-design']} breadcrumbSlug="digital-design" />
    </>
  );
}

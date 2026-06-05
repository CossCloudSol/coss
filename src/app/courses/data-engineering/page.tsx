import type { Metadata } from 'next';
import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import CoursePageSeo from '@/components/CoursePageSeo';
import CourseCategoryPage from '@/components/CourseCategoryPage';
import { courseData } from '@/lib/courseData';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadataWithFallback('courses/data-engineering', buildCategoryPageMetadata('courses/data-engineering'));
}

export default function Page() {
  return (
    <>
      <CoursePageSeo
        slug="courses/data-engineering"
        title="Best Data Engineering Training Institute in Hyderabad"
        description="Join the best data engineering training in Hyderabad. Azure Data Engineer, Spark, Hadoop, ETL, expert trainers, placement support and certification. Enroll now!"
        category="Data Engineering"
      />
      <CourseCategoryPage data={courseData['data-engineering']} breadcrumbSlug="data-engineering" />
    </>
  );
}

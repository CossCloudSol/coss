import type { Metadata } from 'next';
import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import CoursePageSeo from '@/components/CoursePageSeo';
import CourseCategoryPage from '@/components/CourseCategoryPage';
import { courseData } from '@/lib/courseData';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadataWithFallback('courses/data-analytics-bi', buildCategoryPageMetadata('courses/data-analytics-bi'));
}

export default function Page() {
  return (
    <>
      <CoursePageSeo
        slug="courses/data-analytics-bi"
        title="Best Data, Analytics and BI Training Institute in Hyderabad"
        description="Join the best data analytics and BI training in Hyderabad. Data Science, Machine Learning, Power BI, expert trainers, placement support and certification. Enroll now!"
        category="Data, Analytics & BI"
      />
      <CourseCategoryPage data={courseData['data-analytics-bi']} breadcrumbSlug="data-analytics-bi" />
    </>
  );
}

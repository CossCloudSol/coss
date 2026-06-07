import type { Metadata } from 'next';
import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import CoursePageSeo from '@/components/CoursePageSeo';
import CourseCategoryPage from '@/components/CourseCategoryPage';
import { courseData } from '@/lib/courseData';
import { prisma } from '@/lib/db';
import { dbCoursesToCards } from '@/lib/db-courses-to-cards';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadataWithFallback('courses/data-analytics-bi', buildCategoryPageMetadata('courses/data-analytics-bi'));
}

export default async function Page() {
  const courses = await prisma.course.findMany({
    where: { categorySlug: 'data-analytics-bi', status: 'published' },
    orderBy: { sortOrder: 'asc' },
    select: { title: true, slug: true, duration: true, mode: true, level: true, price: true, originalPrice: true, badge: true, highlights: true, excerpt: true, urlType: true, categorySlug: true },
  });
  const dbCourses = dbCoursesToCards(courses, 'data-analytics-bi');

  return (
    <>
      <CoursePageSeo
        slug="courses/data-analytics-bi"
        title="Best Data, Analytics and BI Training Institute in Hyderabad"
        description="Join the best data analytics and BI training in Hyderabad. Data Science, Machine Learning, Power BI, expert trainers, placement support and certification. Enroll now!"
        category="Data, Analytics & BI"
      />
      <CourseCategoryPage data={courseData['data-analytics-bi']} breadcrumbSlug="data-analytics-bi" dbCourses={dbCourses} />
    </>
  );
}

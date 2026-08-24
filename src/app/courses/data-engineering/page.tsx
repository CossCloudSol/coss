import type { Metadata } from 'next';
import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import CoursePageSeo from '@/components/CoursePageSeo';
import CourseCategoryPage from '@/components/CourseCategoryPage';
import { courseData } from '@/lib/courseData';
import { prisma } from '@/lib/db';
import { dbCoursesToCards } from '@/lib/db-courses-to-cards';

export const revalidate = 86400;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadataWithFallback('courses/data-engineering', buildCategoryPageMetadata('courses/data-engineering'));
}

export default async function Page() {
  const courses = await prisma.course.findMany({
    where: { categorySlug: 'data-engineering', status: 'published' },
    orderBy: { sortOrder: 'asc' },
    select: { title: true, slug: true, duration: true, mode: true, level: true, price: true, originalPrice: true, badge: true, highlights: true, excerpt: true, urlType: true, categorySlug: true },
  });
  const dbCourses = dbCoursesToCards(courses, 'data-engineering');

  return (
    <>
      <CoursePageSeo
        slug="courses/data-engineering"
        title="Best Data Engineering Training Institute in Hyderabad"
        description="Join the best data engineering training in Hyderabad. Azure Data Engineer, Spark, Hadoop, ETL, expert trainers, placement support and certification. Enroll now!"
        category="Data Engineering"
      />
      <CourseCategoryPage data={courseData['data-engineering']} breadcrumbSlug="data-engineering" dbCourses={dbCourses} />
    </>
  );
}

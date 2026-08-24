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
  return buildPageMetadataWithFallback('courses/programming-full-stack', buildCategoryPageMetadata('courses/programming-full-stack'));
}

export default async function Page() {
  const courses = await prisma.course.findMany({
    where: { categorySlug: 'programming-full-stack', status: 'published' },
    orderBy: { sortOrder: 'asc' },
    select: { title: true, slug: true, duration: true, mode: true, level: true, price: true, originalPrice: true, badge: true, highlights: true, excerpt: true, urlType: true, categorySlug: true },
  });
  const dbCourses = dbCoursesToCards(courses, 'programming-full-stack');

  return (
    <>
      <CoursePageSeo
        slug="courses/programming-full-stack"
        title="Best Programming and Full Stack Development Training Institute in Hyderabad"
        description="Join the best programming and full stack development training in Hyderabad. Java, Python, React, Node.js, expert trainers, placement support. Enroll now!"
        category="Programming & Full Stack"
      />
      <CourseCategoryPage data={courseData['programming-full-stack']} breadcrumbSlug="programming-full-stack" dbCourses={dbCourses} />
    </>
  );
}

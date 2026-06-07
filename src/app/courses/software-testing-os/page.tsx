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
  return buildPageMetadataWithFallback('courses/software-testing-os', buildCategoryPageMetadata('courses/software-testing-os'));
}

export default async function Page() {
  const courses = await prisma.course.findMany({
    where: { categorySlug: 'software-testing-os', status: 'published' },
    orderBy: { sortOrder: 'asc' },
    select: { title: true, slug: true, duration: true, mode: true, level: true, price: true, originalPrice: true, badge: true, highlights: true, excerpt: true, urlType: true, categorySlug: true },
  });
  const dbCourses = dbCoursesToCards(courses, 'software-testing-os');

  return (
    <>
      <CoursePageSeo
        slug="courses/software-testing-os"
        title="Best Software Testing and OS Training Institute in Hyderabad"
        description="Join the best software testing and OS training in Hyderabad. Manual testing, Selenium, Linux, expert trainers, placement support and certification. Enroll now!"
        category="Software Testing & OS"
      />
      <CourseCategoryPage data={courseData['software-testing-os']} breadcrumbSlug="software-testing-os" dbCourses={dbCourses} />
    </>
  );
}

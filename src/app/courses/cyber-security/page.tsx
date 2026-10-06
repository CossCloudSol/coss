import type { Metadata } from 'next';
import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import CourseCategoryPage from '@/components/CourseCategoryPage';
import { courseData } from '@/lib/courseData';
import { prisma } from '@/lib/db';
import { dbCoursesToCards } from '@/lib/db-courses-to-cards';

export const revalidate = 86400;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadataWithFallback('courses/cyber-security', buildCategoryPageMetadata('courses/cyber-security'));
}

export default async function Page() {
  const courses = await prisma.course.findMany({
    where: { categorySlug: 'cyber-security', status: 'published' },
    orderBy: { sortOrder: 'asc' },
    select: { title: true, slug: true, duration: true, mode: true, level: true, price: true, originalPrice: true, badge: true, highlights: true, excerpt: true, urlType: true, categorySlug: true },
  });
  const dbCourses = dbCoursesToCards(courses, 'cyber-security');

  return (
    <>
      <CourseCategoryPage data={courseData['cyber-security']} breadcrumbSlug="cyber-security" dbCourses={dbCourses} />
    </>
  );
}

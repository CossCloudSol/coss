import type { Metadata } from 'next';
import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import CoursePageSeo from '@/components/CoursePageSeo';
import CourseCategoryPage from '@/components/CourseCategoryPage';
import { courseData } from '@/lib/courseData';
import { prisma } from '@/lib/db';
import { dbCoursesToCards } from '@/lib/db-courses-to-cards';

export const revalidate = 600;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadataWithFallback('courses/professional-soft-skills', buildCategoryPageMetadata('courses/professional-soft-skills'));
}

export default async function Page() {
  const courses = await prisma.course.findMany({
    where: { categorySlug: 'professional-soft-skills', status: 'published' },
    orderBy: { sortOrder: 'asc' },
    select: { title: true, slug: true, duration: true, mode: true, level: true, price: true, originalPrice: true, badge: true, highlights: true, excerpt: true, urlType: true, categorySlug: true },
  });
  const dbCourses = dbCoursesToCards(courses, 'professional-soft-skills');

  return (
    <>
      <CoursePageSeo
        slug="courses/professional-soft-skills"
        title="Best Professional and Soft Skills Training Institute in Hyderabad"
        description="Join the best professional and soft skills training in Hyderabad. MS Office, spoken English, communication skills, expert trainers, placement support. Enroll now!"
        category="Professional & Soft Skills"
      />
      <CourseCategoryPage data={courseData['professional-soft-skills']} breadcrumbSlug="professional-soft-skills" dbCourses={dbCourses} />
    </>
  );
}

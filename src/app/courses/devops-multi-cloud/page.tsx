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
  return buildPageMetadataWithFallback('courses/devops-multi-cloud', buildCategoryPageMetadata('courses/devops-multi-cloud'));
}

export default async function Page() {
  const courses = await prisma.course.findMany({
    where: { categorySlug: 'devops-multi-cloud', status: 'published' },
    orderBy: { sortOrder: 'asc' },
    select: { title: true, slug: true, duration: true, mode: true, level: true, price: true, originalPrice: true, badge: true, highlights: true, excerpt: true, urlType: true, categorySlug: true },
  });
  const dbCourses = dbCoursesToCards(courses, 'devops-multi-cloud');

  return (
    <>
      <CoursePageSeo
        slug="courses/devops-multi-cloud"
        title="Best DevOps and Multi-Cloud Training Institute in Hyderabad"
        description="Join the best DevOps and multi-cloud training in Hyderabad. CI/CD, Docker, Kubernetes, Terraform, expert trainers, placement support and certification. Enroll now!"
        category="DevOps & Multi-Cloud"
      />
      <CourseCategoryPage data={courseData['devops-multi-cloud']} breadcrumbSlug="devops-multi-cloud" dbCourses={dbCourses} />
    </>
  );
}

import type { Metadata } from 'next';
import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import CoursePageSeo from '@/components/CoursePageSeo';
import CourseCategoryPage from '@/components/CourseCategoryPage';
import { courseData } from '@/lib/courseData';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadataWithFallback('courses/devops-multi-cloud', buildCategoryPageMetadata('courses/devops-multi-cloud'));
}

export default function Page() {
  return (
    <>
      <CoursePageSeo
        slug="courses/devops-multi-cloud"
        title="Best DevOps and Multi-Cloud Training Institute in Hyderabad"
        description="Join the best DevOps and multi-cloud training in Hyderabad. CI/CD, Docker, Kubernetes, Terraform, expert trainers, placement support and certification. Enroll now!"
        category="DevOps & Multi-Cloud"
      />
      <CourseCategoryPage data={courseData['devops-multi-cloud']} breadcrumbSlug="devops-multi-cloud" />
    </>
  );
}

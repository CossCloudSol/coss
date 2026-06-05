import type { Metadata } from 'next';
import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import CoursePageSeo from '@/components/CoursePageSeo';
import CourseCategoryPage from '@/components/CourseCategoryPage';
import { courseData } from '@/lib/courseData';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadataWithFallback('courses/cyber-security-networking', buildCategoryPageMetadata('courses/cyber-security-networking'));
}

export default function Page() {
  return (
    <>
      <CoursePageSeo
        slug="courses/cyber-security-networking"
        title="Best Cyber Security and Networking Training Institute in Hyderabad"
        description="Join the best cyber security and networking training in Hyderabad. Ethical hacking, CCNA, SOC, expert trainers, placement support and certification. Enroll now!"
        category="Cyber Security & Networking"
      />
      <CourseCategoryPage data={courseData['cyber-security-networking']} breadcrumbSlug="cyber-security-networking" />
    </>
  );
}

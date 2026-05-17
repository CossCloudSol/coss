import type { Metadata } from 'next';
import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
import CoursePageSeo from '@/components/CoursePageSeo';
import CourseCategoryPage from '@/components/CourseCategoryPage';
import { courseData } from '@/lib/courseData';

export const metadata: Metadata = buildCategoryPageMetadata('software-testing-os');

export default function Page() {
  return (
    <>
      <CoursePageSeo
        slug="software-testing-os"
        title="Best Software Testing and OS Training Institute in Hyderabad"
        description="Join the best software testing and OS training in Hyderabad. Manual testing, Selenium, Linux, expert trainers, placement support and certification. Enroll now!"
        category="Software Testing & OS"
      />
      <CourseCategoryPage data={courseData['software-testing-os']} breadcrumbSlug="software-testing-os" />
    </>
  );
}

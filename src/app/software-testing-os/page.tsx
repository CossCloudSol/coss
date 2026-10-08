import type { Metadata } from 'next';
import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
import CourseCategoryPage from '@/components/CourseCategoryPage';
import { courseData } from '@/lib/courseData';

export const metadata: Metadata = buildCategoryPageMetadata('software-testing-os');

export default function Page() {
  return (
    <>
      <CourseCategoryPage data={courseData['software-testing-os']} breadcrumbSlug="software-testing-os" />
    </>
  );
}

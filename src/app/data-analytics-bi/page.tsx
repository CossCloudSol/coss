import type { Metadata } from 'next';
import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
import CourseCategoryPage from '@/components/CourseCategoryPage';
import { courseData } from '@/lib/courseData';

export const metadata: Metadata = buildCategoryPageMetadata('data-analytics-bi');

export default function Page() {
  return (
    <>
      <CourseCategoryPage data={courseData['data-analytics-bi']} breadcrumbSlug="data-analytics-bi" />
    </>
  );
}

import type { Metadata } from 'next';
import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import CourseCategoryPage from '@/components/CourseCategoryPage';
import { courseData } from '@/lib/courseData';

export const revalidate = 86400;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadataWithFallback('courses/cyber-security-networking', buildCategoryPageMetadata('courses/cyber-security-networking'));
}

export default function Page() {
  return (
    <>
      <CourseCategoryPage data={courseData['cyber-security-networking']} breadcrumbSlug="cyber-security-networking" />
    </>
  );
}

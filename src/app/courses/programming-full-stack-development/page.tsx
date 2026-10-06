import type { Metadata } from 'next';
import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import CourseCategoryPage from '@/components/CourseCategoryPage';
import { courseData } from '@/lib/courseData';

export const revalidate = 86400;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadataWithFallback('courses/programming-full-stack-development', buildCategoryPageMetadata('courses/programming-full-stack-development'));
}

export default function Page() {
  return (
    <>
      <CourseCategoryPage data={courseData['programming-full-stack-development']} breadcrumbSlug="programming-full-stack-development" />
    </>
  );
}

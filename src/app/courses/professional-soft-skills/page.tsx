import type { Metadata } from 'next';
import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import CoursePageSeo from '@/components/CoursePageSeo';
import CourseCategoryPage from '@/components/CourseCategoryPage';
import { courseData } from '@/lib/courseData';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadataWithFallback('courses/professional-soft-skills', buildCategoryPageMetadata('courses/professional-soft-skills'));
}

export default function Page() {
  return (
    <>
      <CoursePageSeo
        slug="courses/professional-soft-skills"
        title="Best Professional and Soft Skills Training Institute in Hyderabad"
        description="Join the best professional and soft skills training in Hyderabad. MS Office, spoken English, communication skills, expert trainers, placement support. Enroll now!"
        category="Professional & Soft Skills"
      />
      <CourseCategoryPage data={courseData['professional-soft-skills']} breadcrumbSlug="professional-soft-skills" />
    </>
  );
}

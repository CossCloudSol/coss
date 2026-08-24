import type { Metadata } from 'next';
import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import CoursePageSeo from '@/components/CoursePageSeo';
import CourseCategoryPage from '@/components/CourseCategoryPage';
import { courseData } from '@/lib/courseData';

export const revalidate = 86400;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadataWithFallback('courses/programming-full-stack-development', buildCategoryPageMetadata('courses/programming-full-stack-development'));
}

export default function Page() {
  return (
    <>
      <CoursePageSeo
        slug="courses/programming-full-stack-development"
        title="Best Programming and Full Stack Development Training Institute in Hyderabad"
        description="Join the best programming and full stack development training in Hyderabad. Java, Python, React, Node.js, expert trainers, placement support. Enroll now!"
        category="Programming & Full Stack"
      />
      <CourseCategoryPage data={courseData['programming-full-stack-development']} breadcrumbSlug="programming-full-stack-development" />
    </>
  );
}

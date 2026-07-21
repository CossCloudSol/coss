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
  return buildPageMetadataWithFallback('courses/erp-crm-enterprise-tools', buildCategoryPageMetadata('courses/erp-crm-enterprise-tools'));
}

export default async function Page() {
  const courses = await prisma.course.findMany({
    where: { categorySlug: 'erp-crm-enterprise-tools', status: 'published' },
    orderBy: { sortOrder: 'asc' },
    select: { title: true, slug: true, duration: true, mode: true, level: true, price: true, originalPrice: true, badge: true, highlights: true, excerpt: true, urlType: true, categorySlug: true },
  });
  const dbCourses = dbCoursesToCards(courses, 'erp-crm-enterprise-tools');

  return (
    <>
      <CoursePageSeo
        slug="courses/erp-crm-enterprise-tools"
        title="Best ERP, CRM and Enterprise Tools Training Institute in Hyderabad"
        description="Join the best ERP, CRM and enterprise tools training in Hyderabad. SAP, Salesforce, Oracle Fusion HCM, expert trainers, placement support. Enroll now!"
        category="ERP, CRM & Enterprise Tools"
      />
      <CourseCategoryPage data={courseData['erp-crm-enterprise-tools']} breadcrumbSlug="erp-crm-enterprise-tools" dbCourses={dbCourses} />
    </>
  );
}

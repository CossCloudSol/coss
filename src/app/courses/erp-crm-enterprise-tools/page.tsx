import type { Metadata } from 'next';
import { buildCategoryPageMetadata } from '@/lib/build-category-page-metadata';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import CoursePageSeo from '@/components/CoursePageSeo';
import CourseCategoryPage from '@/components/CourseCategoryPage';
import { courseData } from '@/lib/courseData';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadataWithFallback('courses/erp-crm-enterprise-tools', buildCategoryPageMetadata('courses/erp-crm-enterprise-tools'));
}

export default function Page() {
  return (
    <>
      <CoursePageSeo
        slug="courses/erp-crm-enterprise-tools"
        title="Best ERP, CRM and Enterprise Tools Training Institute in Hyderabad"
        description="Join the best ERP, CRM and enterprise tools training in Hyderabad. SAP, Salesforce, Oracle Fusion HCM, expert trainers, placement support. Enroll now!"
        category="ERP, CRM & Enterprise Tools"
      />
      <CourseCategoryPage data={courseData['erp-crm-enterprise-tools']} breadcrumbSlug="erp-crm-enterprise-tools" />
    </>
  );
}

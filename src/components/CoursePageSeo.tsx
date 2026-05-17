/**
 * src/components/CoursePageSeo.tsx
 *
 * Server component — injects all JSON-LD structured data scripts into <head>.
 * Works alongside Next.js `generateMetadata` (which handles title/description/
 * OG/canonical). This component handles the JSON-LD schema layer only.
 *
 * Usage in any course page.tsx:
 *
 *   import CoursePageSeo from '@/components/CoursePageSeo';
 *
 *   export default function Page() {
 *     return (
 *       <>
 *         <CoursePageSeo
 *           slug="big-data-training-institute-in-hyderabad"
 *           title="Best Big Data Training Institute in Hyderabad"
 *           description="Join the best big data training in Hyderabad..."
 *           category="Data, Analytics & BI"
 *           faqs={[
 *             { q: 'How long is the course?', a: 'The course duration is 2–3 months.' },
 *           ]}
 *         />
 *         <CourseCategoryPage data={...} breadcrumbSlug={...} />
 *       </>
 *     );
 *   }
 */

import { buildCourseSchemas, type FaqItem } from '@/lib/course-schema';

interface CoursePageSeoProps {
  slug: string;
  title: string;
  description: string;
  category: string;
  faqs?: ReadonlyArray<FaqItem>;
}

export default function CoursePageSeo({
  slug,
  title,
  description,
  category,
  faqs,
}: CoursePageSeoProps) {
  const schemas = buildCourseSchemas({ slug, title, description, category, faqs });

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

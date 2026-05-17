import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart2,
  Cloud,
  Code,
  Settings,
  TestTube,
  Check,
  Phone as PhoneIcon,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { COURSES, type Course } from '@/data/courses-data';
import EnrollSidebarForm from '@/components/DemoSidebarForm';
import CourseAccordionNav from '@/components/CourseAccordionNav';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';

/* -------------------------------------------------------------------------- */
/*  Lookup helpers                                                            */
/* -------------------------------------------------------------------------- */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

/* -------------------------------------------------------------------------- */
/*  Category → courses URL mapping for breadcrumb                            */
/* -------------------------------------------------------------------------- */

/**
 * Maps each of the 10 canonical course categories to its category landing URL.
 * All courses in courses-data.ts now use these exact category strings.
 */
const CATEGORY_URL_MAP: Record<string, string> = {
  'Data, Analytics & BI':        '/courses/data-analytics-bi',
  'Cloud Computing':             '/courses/cloud-computing',
  'DevOps & Multi-Cloud':        '/courses/devops-multi-cloud',
  'Programming & Full Stack':    '/courses/programming-full-stack',
  'Data Engineering':            '/courses/data-engineering',
  'Cyber Security & Networking': '/courses/cyber-security-networking',
  'ERP, CRM & Enterprise Tools': '/courses/erp-crm-enterprise-tools',
  'Software Testing & OS':       '/courses/software-testing-os',
  'Digital & Design':            '/courses/digital-design',
  'Professional & Soft Skills':  '/courses/professional-soft-skills',
};

function getCategoryHref(category: string): string {
  return CATEGORY_URL_MAP[category] ?? '/courses';
}

const ICON_MAP: Record<string, LucideIcon> = {
  Cloud,
  BarChart2,
  Code,
  Settings,
  TestTube,
};

function findCourse(slug: string): Course | null {
  return COURSES.find((c) => c.slug === slug) ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Static params + metadata                                                  */
/* -------------------------------------------------------------------------- */

export function generateStaticParams(): Array<{ courseSlug: string }> {
  return COURSES.map((c) => ({ courseSlug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { courseSlug: string };
}): Promise<Metadata> {
  const course = findCourse(params.courseSlug);
  if (!course) {
    return { title: 'Course Not Found | COSS Cloud Solutions' };
  }
  const url = `${SITE_URL}/${course.slug}/`;
  const fallback: Metadata = {
    title: course.metaTitle,
    description: course.metaDescription,
    keywords: course.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: course.metaTitle,
      description: course.metaDescription,
      url,
      siteName: 'COSS Cloud Solutions',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: course.metaTitle,
      description: course.metaDescription,
    },
  };
  return buildPageMetadataWithFallback(course.slug, fallback);
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function CourseSlugPage({
  params,
}: {
  params: { courseSlug: string };
}): JSX.Element {
  const course = findCourse(params.courseSlug);
  if (!course) notFound();

  // JSON-LD: Course structured data
  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'COSS Cloud Solutions',
      sameAs: SITE_URL,
      address: 'Dilsukhnagar & Ameerpet, Hyderabad, India',
    },
  };

  // JSON-LD: BreadcrumbList for rich-result eligibility
  const categoryHref = getCategoryHref(course.category);
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: course.category,
        item: `${SITE_URL}${categoryHref}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: course.shortTitle,
        item: `${SITE_URL}/${course.slug}`,
      },
    ],
  };

  const Icon: LucideIcon = ICON_MAP[course.icon] ?? Code;

  return (
    <>
      {/* JSON-LD: Course schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      {/* JSON-LD: BreadcrumbList schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Teal header with breadcrumb + h1. */}
      <div className="bg-teal-800 py-12 text-center text-white px-4">
        <nav aria-label="Breadcrumb" className="text-sm opacity-80 mb-2">
          <ol style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap', justifyContent: 'center' }}>
            <li>
              <Link href="/" className="hover:underline" style={{ color: 'inherit' }}>
                Home
              </Link>
            </li>
            <li aria-hidden="true" style={{ opacity: 0.6 }}>›</li>
            <li>
              <Link href={categoryHref} className="hover:underline" style={{ color: 'inherit' }}>
                {course.category}
              </Link>
            </li>
            <li aria-hidden="true" style={{ opacity: 0.6 }}>›</li>
            <li aria-current="page" style={{ opacity: 0.85 }}>
              {course.shortTitle}
            </li>
          </ol>
        </nav>
        <h1 className="text-3xl md:text-4xl font-bold text-white">{course.title}</h1>
      </div>

      {/* Two-col body */}
      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8 py-12 px-4">
        {/* LEFT — main content */}
        <div className="lg:col-span-2 space-y-10">
          {/* Badge + title + description */}
          <div>
            <span
              className={`inline-flex items-center gap-2 ${course.color} text-white text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              {course.badge}
            </span>
            <h2 className="mt-3 text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {course.title}
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* What You'll Learn */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              What You&apos;ll Learn
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {course.topics.map((topic) => (
                <li
                  key={topic}
                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <Check
                    className="w-4 h-4 text-teal-600 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Curriculum — HTML5 <details> for keyboard-accessible accordion
              that needs zero JS. Server-component friendly. */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Course Curriculum
            </h3>
            <div className="space-y-2">
              {course.curriculum.map((mod, i) => (
                <details
                  key={mod.module}
                  open={i === 0}
                  className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <summary className="flex items-center justify-between cursor-pointer px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                    {mod.module}
                    <span
                      className="text-gray-400 group-open:rotate-90 transition-transform"
                      aria-hidden="true"
                    >
                      ›
                    </span>
                  </summary>
                  <ul className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 space-y-1.5">
                    {mod.topics.map((t) => (
                      <li
                        key={t}
                        className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <Check
                          className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>

          {/* Why Choose COSS — 6-feature grid (4 from data + 2 always-included
              guarantees from spec). */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose COSS for {course.shortTitle}?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Expert trainers with 10+ years experience',
                'Hands-on lab practice with real projects',
                '100% placement assistance',
                'Flexible batch timings (weekday/weekend)',
                'Industry-recognized certification',
                'Small batch sizes for personal attention',
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
                >
                  <span
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-600"
                    aria-hidden="true"
                  >
                    <Check className="h-4 w-4" />
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {feature}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Course Location — two centers */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              COSS Training Centers in Hyderabad
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LocationCard
                branch="Dilsukhnagar"
                address="Flat 109, C.B Eastern Homes, Srinagar Colony, Dilsukhnagar, Hyderabad – 500060"
                phone="+91 88851 66007"
              />
              <LocationCard
                branch="Ameerpet"
                address="#502, Sree Swathi Ankur Building, Besides Aditya Trade Center, Ameerpet, Hyderabad – 500038"
                phone="+91 77807 27374"
              />
            </div>
          </section>
        </div>

        {/* RIGHT — sidebar */}
        <aside className="lg:col-span-1 space-y-4">
          {/* Course info card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Course Info
            </h4>
            <dl className="space-y-2 text-sm">
              <InfoRow label="Duration" value={course.duration} />
              <InfoRow label="Level" value={course.level} />
              <InfoRow
                label="Location"
                value="Dilsukhnagar & Ameerpet"
              />
              <InfoRow label="Next Batch" value="Starting Soon" />
            </dl>
          </div>

          {/* Enroll form — existing component, untouched. The current course
              isn't pre-selected because DemoSidebarForm doesn't accept a prop
              for it; user spec says don't change the form. */}
          <EnrollSidebarForm />

          {/* All Courses — accordion grouped by category */}
          <CourseAccordionNav activeSlug={course.slug} />
        </aside>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-white text-right">
        {value}
      </dd>
    </div>
  );
}

function LocationCard({
  branch,
  address,
  phone,
}: {
  branch: string;
  address: string;
  phone: string;
}): JSX.Element {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-teal-700 dark:text-teal-400">
        <MapPin className="h-4 w-4" aria-hidden="true" />
        {branch} Branch
      </p>
      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
        {address}
      </p>
      <a
        href={`tel:${phone.replace(/\s+/g, '')}`}
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline"
      >
        <PhoneIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {phone}
      </a>
    </div>
  );
}

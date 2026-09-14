/**
 * src/lib/course-schema.ts
 *
 * Generates JSON-LD structured data for course pages.
 * Produces four schema types that Google uses for rich results,
 * and that AI engines use for entity/content understanding (GEO):
 *
 *   • Course                     → course rich snippets in SERPs
 *   • FAQPage                   → FAQ accordion directly in SERPs
 *   • BreadcrumbList            → breadcrumb trail in SERPs
 *   • WebPage + speakable       → signals key passages to AI-powered search
 *
 * No aggregateRating: Google disallows self-serving review markup without
 * genuine third-party on-page reviews. See global-schemas.ts for the same
 * rule applied to branch LocalBusiness schema.
 */

import { getAllBranchSettings, FALLBACK, type BranchSettings } from '@/lib/get-branch-settings';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

const LOGO_URL = `${SITE_URL}/logo.png`;

const BRANCH_AREA_LABEL: Record<string, string> = {
  dilsukhnagar: 'Dilsukhnagar',
  ameerpet: 'Ameerpet',
};

/** Resolves a live BranchSettings row by key, falling back to the known-correct NAP constants only when that branch's row is missing from the DB result. */
function resolveBranch(branches: BranchSettings[], branchKey: 'dilsukhnagar' | 'ameerpet'): BranchSettings {
  return branches.find((b) => b.branchKey === branchKey) ?? FALLBACK[branchKey];
}

function toPostalAddress(branch: BranchSettings) {
  return {
    '@type': 'PostalAddress',
    streetAddress: branch.addressLine1,
    addressLocality: `${BRANCH_AREA_LABEL[branch.branchKey] ?? branch.branchKey}, ${branch.city}`,
    addressRegion: branch.state,
    postalCode: branch.pincode,
    addressCountry: 'IN',
  };
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface CourseSchemaInput {
  /** URL slug without leading slash */
  slug: string;
  /** Full course title, e.g. "Best Big Data Training Institute in Hyderabad" */
  title: string;
  /** 1–2 sentence description */
  description: string;
  /** Category label, e.g. "Data, Analytics & BI" */
  category: string;
  /** Optional FAQ items — renders FAQPage schema when provided */
  faqs?: ReadonlyArray<FaqItem>;
}

/** Category → canonical category page URL mapping for correct breadcrumb links */
const CATEGORY_SLUG_MAP: Record<string, string> = {
  'Data, Analytics & BI':        'courses/data-analytics-bi',
  'Cloud Computing':              'courses/cloud-computing',
  'DevOps & Multi-Cloud':         'courses/devops-multi-cloud',
  'Programming & Full Stack':     'courses/programming-full-stack',
  'Data Engineering':             'courses/data-engineering',
  'Cyber Security':               'courses/cyber-security',
  'ERP, CRM & Enterprise':        'courses/erp-crm-enterprise-tools',
  'Software Testing & OS':        'courses/software-testing-os',
  'Digital & Design':             'courses/digital-design',
  'Professional & Soft Skills':   'courses/professional-soft-skills',
};

/**
 * Returns an array of JSON-LD objects ready to be serialised into <script> tags.
 */
export async function buildCourseSchemas(input: CourseSchemaInput): Promise<object[]> {
  const pageUrl = `${SITE_URL}/${input.slug}`;
  const pageId  = `${pageUrl}/#webpage`;
  const schemas: object[] = [];

  const branches = await getAllBranchSettings();
  const dilsukhnagar = resolveBranch(branches, 'dilsukhnagar');
  const ameerpet = resolveBranch(branches, 'ameerpet');
  const branchAddresses = [dilsukhnagar, ameerpet].map(toPostalAddress);

  const provider = {
    '@type': 'EducationalOrganization',
    '@id': `${SITE_URL}/#organization`,
    name: 'COSS Cloud Solutions',
    url: SITE_URL,
    logo: LOGO_URL,
    address: branchAddresses,
    telephone: dilsukhnagar.phone,
    email: dilsukhnagar.email,
  };

  // ── 1. Course schema ────────────────────────────────────────────────────────
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${pageUrl}/#course`,
    name: input.title,
    description: input.description,
    url: pageUrl,
    image: LOGO_URL,
    provider,
    courseMode: ['online', 'onsite'],
    educationalLevel: 'Beginner to Advanced',
    inLanguage: 'en-IN',
    isAccessibleForFree: false,
    offers: {
      '@type': 'Offer',
      category: 'Paid',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString().split('T')[0],
      seller: { '@id': `${SITE_URL}/#organization` },
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: ['online', 'onsite'],
      inLanguage: 'en-IN',
      location: [dilsukhnagar, ameerpet].map((b) => ({
        '@type': 'Place',
        name: `COSS Cloud Solutions — ${BRANCH_AREA_LABEL[b.branchKey] ?? b.branchKey}`,
        address: toPostalAddress(b),
      })),
    },
  });

  // ── 2. FAQPage schema (only when FAQs are provided) ───────────────────────
  // Renders an expandable FAQ accordion directly in Google SERPs.
  if (input.faqs && input.faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${pageUrl}/#faqpage`,
      mainEntity: input.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a,
        },
      })),
    });
  }

  // ── 3. BreadcrumbList schema ───────────────────────────────────────────────
  // Correct category URL in position 3 replaces the previous generic /courses link.
  const categorySlug = CATEGORY_SLUG_MAP[input.category] ?? 'courses';
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}/#breadcrumb`,
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
        name: 'Courses',
        item: `${SITE_URL}/courses`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: input.category,
        item: `${SITE_URL}/${categorySlug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: input.title,
        item: pageUrl,
      },
    ],
  });

  // ── 4. WebPage + speakable schema ─────────────────────────────────────────
  // speakable tells Google (and AI engines like Google Assistant, Perplexity)
  // which CSS selectors contain the most important spoken/readable content.
  // This is a key GEO (Generative Engine Optimization) signal.
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': pageId,
    url: pageUrl,
    name: input.title,
    description: input.description,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    breadcrumb: { '@id': `${pageUrl}/#breadcrumb` },
    about: { '@id': `${pageUrl}/#course` },
    inLanguage: 'en-IN',
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.course-hero-desc', '.course-highlights', '.faq-section'],
    },
  });

  return schemas;
}

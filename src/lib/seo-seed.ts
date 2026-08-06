// This script's upsertPage() writes directly to the production PageSeo
// table (see upsert() below). The claim wording hardcoded here (student
// counts, placement/exam language) must be kept in sync with the site
// copy corrections tracked in the Tier 1 content-remediation work —
// re-running this seed with stale wording will silently overwrite live
// admin-edited SEO rows with outdated or contradictory claims.

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { prisma } from './db';
import { COURSES } from '@/data/courses-data';
import { CATEGORY_PAGES } from '@/lib/all-pages-registry';

const S = 'https://www.cosscloudsol.com';
const ORG = `${S}/#organization`;
const OG_IMAGE = `${S}/og-image.jpg`;

/* ── Schema helpers ─────────────────────────────────────────────────────────── */

function bc(...items: Array<{ name: string; item: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: b.item,
    })),
  };
}

/* ── Static page SEO data (14 pages) ───────────────────────────────────────── */

const STATIC_PAGE_DATA: ReadonlyArray<{
  pageSlug: string;
  pageTitle: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonicalUrl: string;
  schemaMarkup: string;
}> = [
  {
    pageSlug: 'home',
    pageTitle: 'Homepage',
    metaTitle: 'Best IT Training Institute in Hyderabad | Coss Cloud Solutions',
    metaDescription: 'Coss Cloud Solutions: Top IT training in Hyderabad. AI, Cloud, DevOps & 30+ courses. 5,000+ students trained. Placement assistance included. Enroll now!',
    focusKeyword: 'IT training institute in Hyderabad',
    keywords: 'IT training institute in Hyderabad, best software training Hyderabad, AI training, cloud computing course, DevOps training Hyderabad, data science training',
    ogTitle: 'Best IT Training Institute in Hyderabad | Coss Cloud Solutions',
    ogDescription: 'Join 5,000+ students who launched IT careers at Coss Cloud Solutions. AI, Cloud, DevOps, Data Science & 30+ courses with placement assistance in Hyderabad.',
    ogImage: OG_IMAGE,
    canonicalUrl: `${S}/`,
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@graph': [bc({ name: 'Home', item: `${S}/` }), { '@type': 'OfferCatalog', '@id': `${S}/#coursecatalog`, name: 'IT Training Course Catalog', provider: { '@id': ORG }, itemListElement: [{ '@type': 'Offer', itemOffered: { '@type': 'Course', name: 'Artificial Intelligence & Machine Learning', provider: { '@id': ORG } } }, { '@type': 'Offer', itemOffered: { '@type': 'Course', name: 'Cloud Computing (AWS, Azure, GCP)', provider: { '@id': ORG } } }, { '@type': 'Offer', itemOffered: { '@type': 'Course', name: 'DevOps & Multi-Cloud Engineering', provider: { '@id': ORG } } }, { '@type': 'Offer', itemOffered: { '@type': 'Course', name: 'Data Science & Power BI', provider: { '@id': ORG } } }, { '@type': 'Offer', itemOffered: { '@type': 'Course', name: 'Cyber Security & Ethical Hacking', provider: { '@id': ORG } } }, { '@type': 'Offer', itemOffered: { '@type': 'Course', name: 'Full Stack Development', provider: { '@id': ORG } } }] }] }),
  },
  {
    pageSlug: 'courses',
    pageTitle: 'Courses',
    metaTitle: 'IT Courses in Hyderabad — AI, Cloud, DevOps & More | Coss Cloud Solutions',
    metaDescription: 'Explore 30+ expert-led IT courses in Hyderabad — AI, Cloud Computing, DevOps, Data Science, Cyber Security, Full Stack & more. Placement assistance included. Enroll now!',
    focusKeyword: 'IT courses in Hyderabad',
    keywords: 'IT courses Hyderabad, best IT course Hyderabad, cloud computing course, DevOps training, data science certification, software courses Hyderabad',
    ogTitle: '30+ IT Courses in Hyderabad with Placement | Coss Cloud Solutions',
    ogDescription: 'AI, Cloud, DevOps, Data Science, Cyber Security & more. Industry-aligned courses with expert trainers, live projects & placement assistance in Hyderabad.',
    ogImage: OG_IMAGE,
    canonicalUrl: `${S}/courses/`,
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@graph': [bc({ name: 'Home', item: `${S}/` }, { name: 'Courses', item: `${S}/courses/` }), { '@type': 'ItemList', name: 'IT Training Courses in Hyderabad', url: `${S}/courses/`, numberOfItems: 10, itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Data, Analytics & BI', url: `${S}/courses/data-analytics-bi/` }, { '@type': 'ListItem', position: 2, name: 'Cloud Computing', url: `${S}/courses/cloud-computing/` }, { '@type': 'ListItem', position: 3, name: 'DevOps & Multi-Cloud', url: `${S}/courses/devops-multi-cloud/` }, { '@type': 'ListItem', position: 4, name: 'Programming & Full Stack', url: `${S}/courses/programming-full-stack/` }, { '@type': 'ListItem', position: 5, name: 'Data Engineering', url: `${S}/courses/data-engineering/` }, { '@type': 'ListItem', position: 6, name: 'Cyber Security', url: `${S}/courses/cyber-security/` }, { '@type': 'ListItem', position: 7, name: 'ERP, CRM & Enterprise', url: `${S}/courses/erp-crm-enterprise-tools/` }, { '@type': 'ListItem', position: 8, name: 'Software Testing & OS', url: `${S}/courses/software-testing-os/` }, { '@type': 'ListItem', position: 9, name: 'Digital Marketing & Design', url: `${S}/courses/digital-design/` }, { '@type': 'ListItem', position: 10, name: 'Professional & Soft Skills', url: `${S}/courses/professional-soft-skills/` }] }] }),
  },
  {
    pageSlug: 'about',
    pageTitle: 'About Us',
    metaTitle: 'About Coss Cloud Solutions — IT Training Institute Hyderabad',
    metaDescription: 'Learn about Coss Cloud Solutions — a leading IT training institute in Hyderabad since 2010. 5,000+ students trained, expert trainers, Dilsukhnagar & Ameerpet branches.',
    focusKeyword: 'Coss Cloud Solutions Hyderabad',
    keywords: 'Coss Cloud Solutions Hyderabad, IT training institute Hyderabad, about us, best software training institute, Dilsukhnagar training centre',
    ogTitle: 'About Coss Cloud Solutions — Hyderabad IT Training',
    ogDescription: 'Leading IT training institute in Hyderabad since 2010. 5,000+ students trained, 2 centres, 30+ courses, expert trainers with 15+ years of industry experience.',
    ogImage: OG_IMAGE,
    canonicalUrl: `${S}/about-us/`,
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'AboutPage', url: `${S}/about-us/`, name: 'About Coss Cloud Solutions', breadcrumb: bc({ name: 'Home', item: `${S}/` }, { name: 'About Us', item: `${S}/about-us/` }), mainEntity: { '@id': ORG }, foundingDate: '2010' }),
  },
  {
    pageSlug: 'why-us',
    pageTitle: 'Why Choose Us',
    metaTitle: 'Why Choose Coss Cloud Solutions for IT Training in Hyderabad',
    metaDescription: 'Discover why 5000+ students chose Coss Cloud Solutions — industry expert trainers, placement assistance, flexible batches, small batch sizes & affordable fees in Hyderabad.',
    focusKeyword: 'why choose Coss Cloud Solutions',
    keywords: 'best IT training institute Hyderabad, why choose Coss Cloud Solutions, placement-focused IT training Hyderabad, expert IT trainers Hyderabad, affordable IT courses Hyderabad',
    ogTitle: 'Why Choose Coss Cloud Solutions for IT Training in Hyderabad',
    ogDescription: 'Expert trainers, placement assistance, flexible batches, affordable fees & globally recognised certifications. Discover why 5000+ students chose Coss Cloud Solutions.',
    ogImage: OG_IMAGE,
    canonicalUrl: `${S}/why-us/`,
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@graph': [bc({ name: 'Home', item: `${S}/` }, { name: 'Why Choose Us', item: `${S}/why-us/` }), { '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'Why should I choose Coss Cloud Solutions for IT training?', acceptedAnswer: { '@type': 'Answer', text: 'Coss Cloud Solutions offers industry expert trainers with 10+ years experience, placement assistance, small batch sizes, flexible scheduling, globally recognised certifications and affordable fees.' } }, { '@type': 'Question', name: 'Does Coss Cloud Solutions provide placement support?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, Coss Cloud Solutions provides placement assistance including resume building, mock interviews, company referrals and interview coaching. Over 5,000 students have trained with us.' } }, { '@type': 'Question', name: 'Does Coss Cloud Solutions offer online training?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, Coss Cloud Solutions offers live interactive online training alongside offline batches at Dilsukhnagar and Ameerpet. All sessions are recorded for review.' } }, { '@type': 'Question', name: 'What certifications does Coss Cloud Solutions prepare students for?', acceptedAnswer: { '@type': 'Answer', text: 'AWS, Microsoft Azure, Google Cloud, CompTIA, CEH, Salesforce, SAP and many more globally recognised IT certifications.' } }] }] }),
  },
  {
    pageSlug: 'contact',
    pageTitle: 'Contact Us',
    metaTitle: 'Contact Coss Cloud Solutions — Hyderabad IT Training',
    metaDescription: 'Contact Coss Cloud Solutions for IT course enquiries. Dilsukhnagar & Ameerpet, Hyderabad. Call +91 88851 66007 or email info@cosscloudsol.com.',
    focusKeyword: 'contact Coss Cloud Solutions Hyderabad',
    keywords: 'contact Coss Cloud Solutions, IT training enquiry Hyderabad, Dilsukhnagar training centre, Ameerpet IT training, IT course admission Hyderabad',
    ogTitle: 'Contact Coss Cloud Solutions — Hyderabad',
    ogDescription: 'Reach us at Dilsukhnagar or Ameerpet, Hyderabad. Call +91 88851 66007 or email info@cosscloudsol.com for course enquiries and admissions.',
    ogImage: OG_IMAGE,
    canonicalUrl: `${S}/contact-us/`,
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'ContactPage', url: `${S}/contact-us/`, name: 'Contact Coss Cloud Solutions', breadcrumb: bc({ name: 'Home', item: `${S}/` }, { name: 'Contact Us', item: `${S}/contact-us/` }), mainEntity: { '@id': ORG } }),
  },
  {
    pageSlug: 'corporate-training',
    pageTitle: 'Corporate Training',
    metaTitle: 'Corporate IT Training in Hyderabad | Coss Cloud Solutions',
    metaDescription: 'Customised corporate IT training in Hyderabad. AI, Cloud, DevOps, Data Science for teams. Expert trainers, flexible scheduling, on-site & online options.',
    focusKeyword: 'corporate IT training in Hyderabad',
    keywords: 'corporate IT training Hyderabad, employee IT upskilling Hyderabad, corporate cloud training, team DevOps training, corporate training institute Hyderabad',
    ogTitle: 'Corporate IT Training in Hyderabad | Coss Cloud Solutions',
    ogDescription: 'Upskill your workforce with customised corporate IT training. AI, Cloud, DevOps & more. Flexible scheduling, expert trainers, on-site & online delivery.',
    ogImage: OG_IMAGE,
    canonicalUrl: `${S}/corporate-training/`,
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@graph': [bc({ name: 'Home', item: `${S}/` }, { name: 'Corporate Training', item: `${S}/corporate-training/` }), { '@type': 'Service', name: 'Corporate IT Training in Hyderabad', provider: { '@id': ORG }, areaServed: { '@type': 'City', name: 'Hyderabad' }, serviceType: 'Corporate IT Training', url: `${S}/corporate-training/` }] }),
  },
  {
    pageSlug: 'placements',
    pageTitle: 'Placements',
    metaTitle: 'Placement Assistance — IT Training Hyderabad | Coss Cloud Solutions',
    metaDescription: 'Coss Cloud Solutions provides placement assistance. 5,000+ students trained for careers at top IT companies. Resume building, mock interviews & campus drives in Hyderabad.',
    focusKeyword: 'IT training with placement in Hyderabad',
    keywords: 'IT training with placement Hyderabad, placement-focused IT training, job placement IT course Hyderabad, campus recruitment Hyderabad, IT placement support',
    ogTitle: 'Placement Assistance — Coss Cloud Solutions',
    ogDescription: '5,000+ students trained for careers at top IT companies. Resume building, mock interviews, campus drives & company referrals. Start your IT career with full support at Coss Cloud Solutions.',
    ogImage: OG_IMAGE,
    canonicalUrl: `${S}/placements/`,
    // No aggregateRating: Google disallows self-serving review markup without
    // genuine third-party on-page reviews (see global-schemas.ts).
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@graph': [bc({ name: 'Home', item: `${S}/` }, { name: 'Placements', item: `${S}/placements/` }), { '@type': 'EducationalOrganization', '@id': ORG, name: 'Coss Cloud Solutions' }] }),
  },
  {
    pageSlug: 'certification',
    pageTitle: 'Certification',
    metaTitle: 'IT Certifications in Hyderabad — AWS, Azure, Google | Coss Cloud Solutions',
    metaDescription: 'Prepare for AWS, Microsoft Azure, Google Cloud, CompTIA, CEH & more IT certifications at Coss Cloud Solutions Hyderabad. Expert-led coaching with 100% exam assistance.',
    focusKeyword: 'IT certification training Hyderabad',
    keywords: 'IT certification Hyderabad, AWS certification training, Azure certification Hyderabad, Google Cloud certification, CompTIA training, CEH certification Hyderabad',
    ogTitle: 'IT Certifications — AWS, Azure, Google & More | Coss Cloud Solutions',
    ogDescription: 'Prepare for AWS, Microsoft Azure, Google Cloud, CompTIA & more globally recognised certifications at Coss Cloud Solutions Hyderabad with expert-led coaching.',
    ogImage: OG_IMAGE,
    canonicalUrl: `${S}/certification/`,
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@graph': [bc({ name: 'Home', item: `${S}/` }, { name: 'Certification', item: `${S}/certification/` }), { '@type': 'ItemList', name: 'IT Certifications at Coss Cloud Solutions', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'AWS Certified Solutions Architect' }, { '@type': 'ListItem', position: 2, name: 'Microsoft Azure Administrator (AZ-104)' }, { '@type': 'ListItem', position: 3, name: 'Google Cloud Professional Architect' }, { '@type': 'ListItem', position: 4, name: 'Certified Ethical Hacker (CEH)' }, { '@type': 'ListItem', position: 5, name: 'Azure Data Engineer (DP-203)' }, { '@type': 'ListItem', position: 6, name: 'Salesforce Certified Administrator' }] }] }),
  },
  {
    pageSlug: 'student-reviews',
    pageTitle: 'Student Reviews',
    metaTitle: 'Student Reviews & Success Stories | Coss Cloud Solutions',
    metaDescription: 'Read real success stories from 5000+ Coss Cloud Solutions students. Genuine reviews about training quality, expert trainers & placement results in Hyderabad.',
    focusKeyword: 'Coss Cloud Solutions student reviews',
    keywords: 'Coss Cloud Solutions reviews, student testimonials Hyderabad, IT training reviews, student success stories, IT placement reviews Hyderabad',
    ogTitle: 'Student Reviews & Success Stories | Coss Cloud Solutions',
    ogDescription: 'Real reviews from 5000+ students who trained at Coss Cloud Solutions. See how our IT training transformed careers with placement assistance.',
    ogImage: OG_IMAGE,
    canonicalUrl: `${S}/student-reviews/`,
    // No aggregateRating/review: Google disallows self-serving review markup
    // without genuine third-party on-page reviews (see global-schemas.ts).
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@graph': [bc({ name: 'Home', item: `${S}/` }, { name: 'Student Reviews', item: `${S}/student-reviews/` }), { '@type': 'EducationalOrganization', '@id': ORG, name: 'Coss Cloud Solutions' }] }),
  },
  {
    pageSlug: 'blog',
    pageTitle: 'Blog',
    metaTitle: 'IT Career Blogs & Tech Tutorials | Coss Cloud Solutions',
    metaDescription: 'Read the latest IT articles, career tips, tech tutorials & training guides from Coss Cloud Solutions experts. Stay ahead in Cloud, DevOps, AI & Data Science.',
    focusKeyword: 'IT training blog Hyderabad',
    keywords: 'IT training blog, cloud computing articles, DevOps tutorials, data science tips, career guidance IT professionals, AI blog India',
    ogTitle: 'IT Training Blog & Career Tips | Coss Cloud Solutions',
    ogDescription: 'Expert IT articles, technology tutorials and career guidance from Coss Cloud Solutions trainers. Stay ahead in Cloud, AI, DevOps & Data Science.',
    ogImage: OG_IMAGE,
    canonicalUrl: `${S}/blog/`,
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@graph': [bc({ name: 'Home', item: `${S}/` }, { name: 'Blog', item: `${S}/blog/` }), { '@type': 'Blog', name: 'Coss Cloud Solutions IT Training Blog', url: `${S}/blog/`, publisher: { '@id': ORG }, inLanguage: 'en-IN' }] }),
  },
  {
    pageSlug: 'enroll-now-with-coss',
    pageTitle: 'Enroll Now',
    metaTitle: 'Enroll in IT Training — Coss Cloud Solutions Hyderabad',
    metaDescription: 'Start your IT career today. Enroll in AI, Cloud, DevOps, Data Science or any of 30+ courses at Coss Cloud Solutions Hyderabad. Free demo available.',
    focusKeyword: 'enroll IT training Hyderabad',
    keywords: 'enroll IT course Hyderabad, IT training admission Hyderabad, join IT course Hyderabad, Coss Cloud Solutions enrollment, start IT training Hyderabad',
    ogTitle: 'Enroll in IT Training — Coss Cloud Solutions Hyderabad',
    ogDescription: 'Start your IT career today. Join 30+ expert-led courses in AI, Cloud, DevOps & Data Science. Free demo available. Placement assistance at Coss Cloud Solutions.',
    ogImage: OG_IMAGE,
    canonicalUrl: `${S}/enroll-now-with-coss/`,
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'ContactPage', url: `${S}/enroll-now-with-coss/`, name: 'Enroll at Coss Cloud Solutions', breadcrumb: bc({ name: 'Home', item: `${S}/` }, { name: 'Enroll Now', item: `${S}/enroll-now-with-coss/` }), mainEntity: { '@id': ORG } }),
  },
  {
    pageSlug: 'free-demo-class',
    pageTitle: 'Free Demo Class',
    metaTitle: 'Book a Free IT Demo Class — Coss Cloud Solutions Hyderabad',
    metaDescription: 'Attend a FREE demo IT training class at Coss Cloud Solutions Hyderabad. Experience expert-led training in Cloud, DevOps, AI & more. No fees, no commitment.',
    focusKeyword: 'free demo IT class Hyderabad',
    keywords: 'free demo class Hyderabad, IT training demo Hyderabad, free IT class, Coss Cloud Solutions free demo, IT training trial Hyderabad',
    ogTitle: 'Free IT Training Demo Class | Coss Cloud Solutions',
    ogDescription: 'Book a free demo class at Coss Cloud Solutions. Experience expert-led IT training in Cloud, DevOps, AI & more — no fees, no commitment, in Hyderabad.',
    ogImage: OG_IMAGE,
    canonicalUrl: `${S}/free-demo-class/`,
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@graph': [bc({ name: 'Home', item: `${S}/` }, { name: 'Free Demo Class', item: `${S}/free-demo-class/` }), { '@type': 'Event', name: 'Free IT Training Demo Class', organizer: { '@id': ORG }, eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode', eventStatus: 'https://schema.org/EventScheduled', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR', availability: 'https://schema.org/InStock', url: `${S}/free-demo-class/` } }] }),
  },
  {
    pageSlug: 'privacy-policy',
    pageTitle: 'Privacy Policy',
    metaTitle: 'Privacy Policy | Coss Cloud Solutions Hyderabad',
    metaDescription: 'Read the Privacy Policy of Coss Cloud Solutions. Understand how we collect, use, and protect your personal information for IT training services in Hyderabad.',
    focusKeyword: 'Coss Cloud Solutions privacy policy',
    keywords: 'COSS privacy policy, data protection policy, personal information IT training, privacy Coss Cloud Solutions',
    ogTitle: 'Privacy Policy | Coss Cloud Solutions',
    ogDescription: 'How Coss Cloud Solutions collects, uses and protects your personal information when using our IT training and placement services in Hyderabad.',
    ogImage: OG_IMAGE,
    canonicalUrl: `${S}/privacy-policy/`,
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', url: `${S}/privacy-policy/`, name: 'Privacy Policy — Coss Cloud Solutions', breadcrumb: bc({ name: 'Home', item: `${S}/` }, { name: 'Privacy Policy', item: `${S}/privacy-policy/` }), publisher: { '@id': ORG } }),
  },
  {
    pageSlug: 'terms-conditions',
    pageTitle: 'Terms & Conditions',
    metaTitle: 'Terms & Conditions | Coss Cloud Solutions Hyderabad',
    metaDescription: 'Terms and Conditions for Coss Cloud Solutions IT training in Hyderabad. Enrollment policy, fees, refund policy, and student conduct guidelines.',
    focusKeyword: 'Coss Cloud Solutions terms and conditions',
    keywords: 'Coss Cloud Solutions terms conditions, IT training enrollment policy, refund policy Hyderabad, student conduct guidelines Coss Cloud Solutions',
    ogTitle: 'Terms & Conditions | Coss Cloud Solutions',
    ogDescription: 'Enrollment terms, fees, refund policy and student conduct guidelines for Coss Cloud Solutions IT training programs in Hyderabad.',
    ogImage: OG_IMAGE,
    canonicalUrl: `${S}/terms-conditions/`,
    schemaMarkup: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', url: `${S}/terms-conditions/`, name: 'Terms & Conditions — Coss Cloud Solutions', breadcrumb: bc({ name: 'Home', item: `${S}/` }, { name: 'Terms & Conditions', item: `${S}/terms-conditions/` }), publisher: { '@id': ORG } }),
  },
];

/* ── All slugs the seed manages (used by hasGap check) ──────────────────────── */

export const SEED_PAGE_SLUGS: ReadonlyArray<string> = STATIC_PAGE_DATA.map(
  (p) => p.pageSlug,
);

/* ── Seed static pages ──────────────────────────────────────────────────────── */

async function upsertPage(data: {
  pageSlug: string;
  pageTitle: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonicalUrl: string;
  schemaMarkup: string;
}): Promise<void> {
  await prisma.pageSeo.upsert({
    where: { pageSlug: data.pageSlug },
    update: {
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      focusKeyword: data.focusKeyword,
      keywords: data.keywords,
      ogTitle: data.ogTitle,
      ogDescription: data.ogDescription,
      ogImage: data.ogImage,
      canonicalUrl: data.canonicalUrl,
      schemaMarkup: data.schemaMarkup,
    },
    create: {
      pageSlug: data.pageSlug,
      pageTitle: data.pageTitle,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      focusKeyword: data.focusKeyword,
      keywords: data.keywords,
      ogTitle: data.ogTitle,
      ogDescription: data.ogDescription,
      ogImage: data.ogImage,
      canonicalUrl: data.canonicalUrl,
      schemaMarkup: data.schemaMarkup,
    },
  });
}

export async function seedSeoPages(): Promise<void> {
  for (const page of STATIC_PAGE_DATA) {
    await upsertPage(page);
  }
}

/* ── Seed course pages (36) from courses-data.ts ───────────────────────────── */

export async function seedCoursePages(): Promise<void> {
  for (const course of COURSES) {
    const url = `${S}/${course.slug}/`;
    const ogTitle = course.metaTitle.replace(' | Coss Cloud Solutions', '').replace(' | Coss Cloud Solutions', '');
    const schema = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        bc(
          { name: 'Home', item: `${S}/` },
          { name: 'Courses', item: `${S}/courses/` },
          { name: course.shortTitle, item: url },
        ),
        {
          '@type': 'Course',
          name: course.title,
          description: course.metaDescription,
          provider: { '@id': ORG },
          url,
          educationalLevel: course.level,
          timeRequired: course.duration,
          inLanguage: 'en-IN',
          teaches: course.topics.slice(0, 6),
        },
      ],
    });

    await upsertPage({
      pageSlug: course.slug,
      pageTitle: course.shortTitle,
      metaTitle: course.metaTitle.includes('|') ? course.metaTitle.split('|')[0].trim() : course.metaTitle,
      metaDescription: course.metaDescription,
      focusKeyword: course.keywords.split(',')[0].trim(),
      keywords: course.keywords,
      ogTitle,
      ogDescription: course.metaDescription,
      ogImage: OG_IMAGE,
      canonicalUrl: url,
      schemaMarkup: schema,
    });
  }
}

/* ── Seed category pages (10) from CATEGORY_PAGES ──────────────────────────── */

export async function seedCategoryPages(): Promise<void> {
  for (const cat of CATEGORY_PAGES) {
    const url = `${S}/${cat.slug}/`;
    const schema = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        bc(
          { name: 'Home', item: `${S}/` },
          { name: 'Courses', item: `${S}/courses/` },
          { name: cat.category, item: url },
        ),
        {
          '@type': 'ItemList',
          name: cat.title,
          description: cat.metaDescription,
          url,
          provider: { '@id': ORG },
        },
      ],
    });

    await upsertPage({
      pageSlug: cat.slug,
      pageTitle: cat.category,
      metaTitle: cat.title.includes('|') ? cat.title.split('|')[0].trim() : cat.title,
      metaDescription: cat.metaDescription,
      focusKeyword: cat.keywords.split(',')[0].trim(),
      keywords: cat.keywords,
      ogTitle: cat.title,
      ogDescription: cat.metaDescription,
      ogImage: OG_IMAGE,
      canonicalUrl: url,
      schemaMarkup: schema,
    });
  }
}

/* ── Seed blog posts from content/posts filesystem ─────────────────────────── */

function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 1) + '…';
}

function blogMetaDescription(title: string): string {
  const clean = title.replace(/–|-|—/g, '').replace(/\s+/g, ' ').trim();
  const desc = `${clean} — Expert IT training insights from Coss Cloud Solutions, Hyderabad's leading IT institute.`;
  return truncate(desc, 158);
}

export async function seedBlogPosts(): Promise<void> {
  const postsDir = path.join(process.cwd(), 'content', 'posts');
  if (!fs.existsSync(postsDir)) return;

  const files = fs.readdirSync(postsDir).filter(
    (f) => f.endsWith('.mdx') || f.endsWith('.md'),
  );

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
      const { data } = matter(raw);

      const slug: string =
        typeof data.slug === 'string' && data.slug.trim()
          ? data.slug.trim()
          : file.replace(/\.(mdx?|md)$/, '');

      const rawTitle: unknown = data.title;
      const title: string =
        typeof rawTitle === 'string' && rawTitle.trim() && rawTitle !== '[object Object]'
          ? rawTitle.trim()
          : slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      const pageSlug = `blog/${slug}`;
      const url = `${S}/blog/${slug}/`;
      const metaTitle = truncate(title, 55) + ' | Coss Cloud Solutions';
      const metaDescription = blogMetaDescription(title);
      const focusKeyword = title.split(' ').slice(0, 4).join(' ').toLowerCase();

      const dateStr: unknown = data.date;
      const dateIso =
        typeof dateStr === 'string' ? dateStr : new Date().toISOString();

      const schema = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description: metaDescription,
        url,
        author: { '@id': ORG },
        publisher: { '@id': ORG },
        datePublished: dateIso,
        inLanguage: 'en-IN',
        breadcrumb: bc(
          { name: 'Home', item: `${S}/` },
          { name: 'Blog', item: `${S}/blog/` },
          { name: truncate(title, 60), item: url },
        ),
      });

      await upsertPage({
        pageSlug,
        pageTitle: truncate(title, 80),
        metaTitle,
        metaDescription,
        focusKeyword,
        keywords: `${focusKeyword}, IT training Hyderabad, Coss Cloud Solutions, ${title.split(' ').slice(0, 2).join(' ').toLowerCase()} Hyderabad`,
        ogTitle: truncate(title, 60),
        ogDescription: metaDescription,
        ogImage: OG_IMAGE,
        canonicalUrl: url,
        schemaMarkup: schema,
      });
    } catch {
      // skip malformed post files
    }
  }
}

/**
 * src/lib/global-schemas.ts
 *
 * Site-wide JSON-LD structured data injected on every page via RootLayout.
 * Covers the two schema types that power Google Knowledge Panel and
 * Sitelinks Search Box, and AI-engine entity recognition (GEO):
 *
 *   1. Organization + EducationalOrganization  → entity anchor for all pages
 *   2. WebSite + SearchAction                  → Sitelinks Search Box
 *
 * Branch LocalBusiness schema is intentionally NOT included here — each
 * /locations/{branch} page emits its own single LocalBusiness block via
 * buildLocalBusinessSchema() below. Emitting it sitewide as well produced
 * duplicate/irrelevant LocalBusiness blocks on every page (e.g. the
 * Ameerpet block showing up on the Dilsukhnagar page and vice versa).
 */

import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/db'
import { getAllBranchSettings, GBP_SAME_AS, type BranchSettings } from '@/lib/get-branch-settings'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

const LOGO_URL = `${SITE_URL}/logo.png`;

const getCachedSchemaSiteSettings = unstable_cache(
  () => prisma.siteSettings.findFirst({
    select: {
      schemaOrgEnabled: true, schemaWebSiteEnabled: true,
      schemaOrgOverride: true, schemaWebSiteOverride: true,
    },
  }),
  ['global-schemas-site-settings'],
  { tags: ['site-settings'], revalidate: 86400 },
)

function parseOverride(raw: string | null | undefined): object | null {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

/**
 * Builds a LocalBusiness + EducationalOrganization JSON-LD schema for a single
 * branch. Shared by the sitewide global schema injection (buildGlobalSchemas)
 * and the /locations/{branch} landing pages, so the two never drift apart.
 */
export function buildLocalBusinessSchema(branch: BranchSettings): object {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'EducationalOrganization'],
    '@id': `${SITE_URL}/#branch-${branch.branchKey}`,
    name: branch.branchName,
    image: LOGO_URL,
    url: `${SITE_URL}/locations/${branch.branchKey}`,
    telephone: branch.phone,
    email: branch.email,
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: branch.addressLine1 + (branch.addressLine2 ? ', ' + branch.addressLine2 : ''),
      addressLocality: branch.city,
      addressRegion: branch.state,
      postalCode: branch.pincode,
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: branch.latitude,
      longitude: branch.longitude,
    },
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
      ],
      opens: branch.workingHoursOpen,
      closes: branch.workingHoursClose,
    }],
    // No aggregateRating: Google disallows self-serving review markup (rating
    // schema on your own business without genuine third-party on-page reviews).
    // The on-page "★ Google rating" text is fine — only the schema must omit it.
    ...(GBP_SAME_AS[branch.branchKey] ? { sameAs: [GBP_SAME_AS[branch.branchKey]] } : {}),
    parentOrganization: { '@id': `${SITE_URL}/#organization` },
  }
}

export async function buildGlobalSchemas(): Promise<object[]> {
  const branches = await getAllBranchSettings()
  const dilsukhnagar = branches.find(b => b.branchKey === 'dilsukhnagar') ?? branches[0]
  const ameerpet     = branches.find(b => b.branchKey === 'ameerpet')     ?? branches[1]

  let settings: {
    schemaOrgEnabled: boolean
    schemaWebSiteEnabled: boolean
    schemaOrgOverride: string | null
    schemaWebSiteOverride: string | null
  } = {
    schemaOrgEnabled: true, schemaWebSiteEnabled: true,
    schemaOrgOverride: null, schemaWebSiteOverride: null,
  }

  try {
    const row = await getCachedSchemaSiteSettings()
    if (row) settings = { ...settings, ...row }
  } catch {
    // DB unavailable — use defaults
  }

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'EducationalOrganization'],
    '@id': `${SITE_URL}/#organization`,
    name: 'Coss Cloud Solutions',
    alternateName: ['COSS', 'Coss Cloud Solutions Hyderabad'],
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      '@id': `${SITE_URL}/#logo`,
      url: LOGO_URL,
      contentUrl: LOGO_URL,
      caption: 'Coss Cloud Solutions — IT Training Hyderabad',
    },
    image: { '@id': `${SITE_URL}/#logo` },
    description:
      'Coss Cloud Solutions is a leading IT training institute in Hyderabad offering expert-led courses in AI, Cloud Computing, DevOps, Data Science, Cyber Security, ERP and more with 100% placement assistance at Dilsukhnagar and Ameerpet centres.',
    foundingDate: '2010',
    email: dilsukhnagar.email,
    telephone: dilsukhnagar.phone.replace(/\s/g, ''),
    address: [
      {
        '@type': 'PostalAddress',
        streetAddress: dilsukhnagar.addressLine1,
        addressLocality: `${dilsukhnagar.addressLine2 ? dilsukhnagar.addressLine2 + ', ' : ''}${dilsukhnagar.city}`,
        addressRegion: dilsukhnagar.state,
        postalCode: dilsukhnagar.pincode,
        addressCountry: 'IN',
      },
      {
        '@type': 'PostalAddress',
        streetAddress: ameerpet.addressLine1 + (ameerpet.addressLine2 ? ', ' + ameerpet.addressLine2 : ''),
        addressLocality: ameerpet.city,
        addressRegion: ameerpet.state,
        postalCode: ameerpet.pincode,
        addressCountry: 'IN',
      },
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: dilsukhnagar.phone,
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi', 'Telugu'],
      },
      {
        '@type': 'ContactPoint',
        telephone: ameerpet.phone,
        contactType: 'admissions',
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi', 'Telugu'],
      },
    ],
    sameAs: [
      'https://www.facebook.com/CossCloudSolutions/',
      'https://x.com/DsnrCoss',
      'https://www.instagram.com/cosscloudsolutionshyd/',
      'https://www.linkedin.com/company/coss-cloud-solutions',
      'https://www.youtube.com/@cossdsnr-b5e',
    ],
  }

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'Coss Cloud Solutions',
    alternateName: 'COSS IT Training Hyderabad',
    url: SITE_URL,
    description:
      'Best IT training institute in Hyderabad — AI, Cloud Computing, DevOps, Data Science and 30+ courses with placement support.',
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en-IN',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/?s={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return [
    // ── 1. Organization + EducationalOrganization ────────────────────────────
    ...(settings.schemaOrgEnabled ? [
      parseOverride(settings.schemaOrgOverride) ?? orgSchema
    ] : []),

    // ── 2. WebSite + SearchAction ────────────────────────────────────────────
    ...(settings.schemaWebSiteEnabled ? [
      parseOverride(settings.schemaWebSiteOverride) ?? webSiteSchema
    ] : []),

    // Branch LocalBusiness schema is NOT emitted here — see file header.
    // Each /locations/{branch} page emits its own via buildLocalBusinessSchema().
  ];
}

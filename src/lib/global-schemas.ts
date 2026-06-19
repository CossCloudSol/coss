/**
 * src/lib/global-schemas.ts
 *
 * Site-wide JSON-LD structured data injected on every page via RootLayout.
 * Covers four schema types that power Google Knowledge Panel, Local Pack,
 * Sitelinks Search Box, and AI-engine entity recognition (GEO):
 *
 *   1. Organization + EducationalOrganization  → entity anchor for all pages
 *   2. WebSite + SearchAction                  → Sitelinks Search Box
 *   3. LocalBusiness — Dilsukhnagar branch     → Local Pack / Maps
 *   4. LocalBusiness — Ameerpet branch         → Local Pack / Maps
 */

import { getAllBranchSettings } from '@/lib/get-branch-settings'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

const LOGO_URL = `${SITE_URL}/logo.png`;

export async function buildGlobalSchemas(): Promise<object[]> {
  const branches = await getAllBranchSettings()
  const dilsukhnagar = branches.find(b => b.branchKey === 'dilsukhnagar') ?? branches[0]
  const ameerpet     = branches.find(b => b.branchKey === 'ameerpet')     ?? branches[1]

  return [
    // ── 1. Organization + EducationalOrganization ────────────────────────────
    {
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
    },

    // ── 2. WebSite + SearchAction ────────────────────────────────────────────
    {
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
    },

    // ── 3. LocalBusiness — Dilsukhnagar ──────────────────────────────────────
    ...(dilsukhnagar.schemaEnabled ? [{
      '@context': 'https://schema.org',
      '@type': ['LocalBusiness', 'EducationalOrganization'],
      '@id': `${SITE_URL}/#branch-dilsukhnagar`,
      name: dilsukhnagar.branchName,
      image: LOGO_URL,
      url: SITE_URL,
      telephone: dilsukhnagar.phone,
      email: dilsukhnagar.email,
      priceRange: '₹₹',
      address: {
        '@type': 'PostalAddress',
        streetAddress: dilsukhnagar.addressLine1 + (dilsukhnagar.addressLine2 ? ', ' + dilsukhnagar.addressLine2 : ''),
        addressLocality: dilsukhnagar.city,
        addressRegion: dilsukhnagar.state,
        postalCode: dilsukhnagar.pincode,
        addressCountry: 'IN',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: dilsukhnagar.latitude,
        longitude: dilsukhnagar.longitude,
      },
      openingHoursSpecification: [{
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: dilsukhnagar.workingDays.split('-'),
        opens: dilsukhnagar.workingHoursOpen,
        closes: dilsukhnagar.workingHoursClose,
      }],
      ...(dilsukhnagar.reviewCount > 0 ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: dilsukhnagar.aggregateRating,
          reviewCount: dilsukhnagar.reviewCount,
          bestRating: '5',
          worstRating: '1',
        },
      } : {}),
      parentOrganization: { '@id': `${SITE_URL}/#organization` },
    }] : []),

    // ── 4. LocalBusiness — Ameerpet ──────────────────────────────────────────
    ...(ameerpet.schemaEnabled ? [{
      '@context': 'https://schema.org',
      '@type': ['LocalBusiness', 'EducationalOrganization'],
      '@id': `${SITE_URL}/#branch-ameerpet`,
      name: ameerpet.branchName,
      image: LOGO_URL,
      url: SITE_URL,
      telephone: ameerpet.phone,
      email: ameerpet.email,
      priceRange: '₹₹',
      address: {
        '@type': 'PostalAddress',
        streetAddress: ameerpet.addressLine1 + (ameerpet.addressLine2 ? ', ' + ameerpet.addressLine2 : ''),
        addressLocality: ameerpet.city,
        addressRegion: ameerpet.state,
        postalCode: ameerpet.pincode,
        addressCountry: 'IN',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: ameerpet.latitude,
        longitude: ameerpet.longitude,
      },
      openingHoursSpecification: [{
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ameerpet.workingDays.split('-'),
        opens: ameerpet.workingHoursOpen,
        closes: ameerpet.workingHoursClose,
      }],
      ...(ameerpet.reviewCount > 0 ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: ameerpet.aggregateRating,
          reviewCount: ameerpet.reviewCount,
          bestRating: '5',
          worstRating: '1',
        },
      } : {}),
      parentOrganization: { '@id': `${SITE_URL}/#organization` },
    }] : []),
  ];
}

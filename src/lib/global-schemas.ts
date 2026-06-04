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

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

const LOGO_URL = `${SITE_URL}/logo.png`;

export function buildGlobalSchemas(): object[] {
  return [
    // ── 1. Organization + EducationalOrganization ────────────────────────────
    // Tells Google who we are. The @id anchors all other schemas to this entity.
    {
      '@context': 'https://schema.org',
      '@type': ['Organization', 'EducationalOrganization'],
      '@id': `${SITE_URL}/#organization`,
      name: 'COSS Cloud Solutions',
      alternateName: ['COSS', 'Coss Cloud Solutions Hyderabad'],
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        '@id': `${SITE_URL}/#logo`,
        url: LOGO_URL,
        contentUrl: LOGO_URL,
        caption: 'COSS Cloud Solutions — IT Training Hyderabad',
      },
      image: { '@id': `${SITE_URL}/#logo` },
      description:
        'COSS Cloud Solutions is a leading IT training institute in Hyderabad offering expert-led courses in AI, Cloud Computing, DevOps, Data Science, Cyber Security, ERP and more with 100% placement assistance at Dilsukhnagar and Ameerpet centres.',
      foundingDate: '2010',
      email: 'info@cosscloudsol.com',
      telephone: '+918885166007',
      address: [
        {
          '@type': 'PostalAddress',
          streetAddress: 'Flat 109, CB Eastern Homes, Kamala Nagar',
          addressLocality: 'Dilsukhnagar, Hyderabad',
          addressRegion: 'Telangana',
          postalCode: '500060',
          addressCountry: 'IN',
        },
        {
          '@type': 'PostalAddress',
          streetAddress: '#502, Sree Swathi Ankur Building, Besides Aditya Trade Center',
          addressLocality: 'Ameerpet, Hyderabad',
          addressRegion: 'Telangana',
          postalCode: '500038',
          addressCountry: 'IN',
        },
      ],
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+91-8885166007',
          contactType: 'customer service',
          areaServed: 'IN',
          availableLanguage: ['English', 'Hindi', 'Telugu'],
        },
        {
          '@type': 'ContactPoint',
          telephone: '+91-7780727374',
          contactType: 'admissions',
          areaServed: 'IN',
          availableLanguage: ['English', 'Hindi', 'Telugu'],
        },
      ],
      // sameAs links connect the org entity to its verified social profiles —
      // critical for Google Knowledge Panel and AI engine entity resolution.
      sameAs: [
        'https://www.facebook.com/CossCloudSolutions/',
        'https://x.com/DsnrCoss',
        'https://www.instagram.com/cosscloudsolutionshyd/',
        'https://www.linkedin.com/company/coss-cloud-solutions',
        'https://www.youtube.com/@cossdsnr-b5e',
      ],
    },

    // ── 2. WebSite + SearchAction ────────────────────────────────────────────
    // Enables Google Sitelinks Search Box directly in SERPs.
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'COSS Cloud Solutions',
      alternateName: 'COSS IT Training Hyderabad',
      url: SITE_URL,
      description:
        'Best IT training institute in Hyderabad — AI, Cloud Computing, DevOps, Data Science and 36+ courses with placement support.',
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
    // Geo-coordinates power Google Maps rich results and "near me" searches.
    {
      '@context': 'https://schema.org',
      '@type': ['LocalBusiness', 'EducationalOrganization'],
      '@id': `${SITE_URL}/#branch-dilsukhnagar`,
      name: 'COSS Cloud Solutions — Dilsukhnagar',
      image: LOGO_URL,
      url: SITE_URL,
      telephone: '+918885166007',
      email: 'info@cosscloudsol.com',
      priceRange: '₹₹',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Flat 109, C.B Eastern Homes, Srinagar Colony',
        addressLocality: 'Dilsukhnagar',
        addressRegion: 'Telangana',
        postalCode: '500060',
        addressCountry: 'IN',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 17.3617,
        longitude: 78.5262,
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: [
            'Monday', 'Tuesday', 'Wednesday',
            'Thursday', 'Friday', 'Saturday',
          ],
          opens: '09:00',
          closes: '19:00',
        },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '1250',
        bestRating: '5',
        worstRating: '1',
      },
      parentOrganization: { '@id': `${SITE_URL}/#organization` },
    },

    // ── 4. LocalBusiness — Ameerpet ──────────────────────────────────────────
    {
      '@context': 'https://schema.org',
      '@type': ['LocalBusiness', 'EducationalOrganization'],
      '@id': `${SITE_URL}/#branch-ameerpet`,
      name: 'COSS Cloud Solutions — Ameerpet',
      image: LOGO_URL,
      url: SITE_URL,
      telephone: '+917780727374',
      email: 'info@cosscloudsol.com',
      priceRange: '₹₹',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '#502, Sree Swathi Ankur Building',
        addressLocality: 'Ameerpet',
        addressRegion: 'Telangana',
        postalCode: '500038',
        addressCountry: 'IN',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 17.4375,
        longitude: 78.4482,
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: [
            'Monday', 'Tuesday', 'Wednesday',
            'Thursday', 'Friday', 'Saturday',
          ],
          opens: '09:00',
          closes: '19:00',
        },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '980',
        bestRating: '5',
        worstRating: '1',
      },
      parentOrganization: { '@id': `${SITE_URL}/#organization` },
    },
  ];
}

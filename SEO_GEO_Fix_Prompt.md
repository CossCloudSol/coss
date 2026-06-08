# Claude Code — Technical SEO + GEO Fixes
# Project: C:\Users\zoomn\OneDrive\Dokumen\CLOUDE Code\coss-nextjs-complete\nextjs-project-coss
# Target domain: https://www.cosscloudsol.com

---

## CRITICAL RULE — DO NOT TOUCH THESE URLS
The following legacy category slugs are already indexed in Google Search Console.
NEVER rename, redirect, or change these URL paths:
/courses/data-analytics-bi
/courses/cloud-computing
/courses/devops-multi-cloud
/courses/programming-full-stack
/courses/data-engineering
/courses/cyber-security
/courses/erp-crm-enterprise-tools
/courses/software-testing-os
/courses/digital-design
/courses/professional-soft-skills

Only fix metadata, content text, schema, and technical SEO.
Never touch file names, folder names, or routing for these pages.

---

## BEFORE YOU START

Read these files first:
```
src/app/layout.tsx
src/app/sitemap.ts (or sitemap.xml in public/)
src/app/robots.ts (or robots.txt in public/)
next.config.ts
src/app/courses/data-analytics-bi/page.tsx
src/app/page.tsx
```

Report what you find before making changes.

---

## STEP 1 — metadataBase (layout.tsx)

Find the metadata export in src/app/layout.tsx.
Update metadataBase to the real domain:

```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://www.cosscloudsol.com'),
  title: {
    default: 'Coss Cloud Solutions — IT Training Institute in Hyderabad',
    template: '%s | Coss Cloud Solutions',
  },
  description: 'Best IT training institute in Hyderabad with expert trainers, hands-on labs, and 100% placement support. Courses in Data Science, AWS, DevOps, SAP, Full Stack & more.',
  keywords: ['IT training Hyderabad', 'software training Hyderabad', 'data science course Hyderabad', 'AWS training Hyderabad', 'DevOps training Hyderabad', 'Coss Cloud Solutions'],
  authors: [{ name: 'Coss Cloud Solutions' }],
  creator: 'Coss Cloud Solutions',
  publisher: 'Coss Cloud Solutions',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.cosscloudsol.com',
    siteName: 'Coss Cloud Solutions',
    title: 'Coss Cloud Solutions — IT Training Institute in Hyderabad',
    description: 'Best IT training institute in Hyderabad. Expert trainers, hands-on labs, placement support. Join 5,000+ students.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Coss Cloud Solutions — IT Training in Hyderabad',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coss Cloud Solutions — IT Training Institute in Hyderabad',
    description: 'Best IT training institute in Hyderabad. Expert trainers, hands-on labs, placement support.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}
```

---

## STEP 2 — robots.ts

Create or update src/app/robots.ts:

```ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/admin/', '/api/', '/_next/'],
      },
    ],
    sitemap: 'https://www.cosscloudsol.com/sitemap.xml',
    host: 'https://www.cosscloudsol.com',
  }
}
```

If robots.txt exists in public/, delete it and use the robots.ts route instead.

---

## STEP 3 — sitemap.ts

Create or update src/app/sitemap.ts with ALL pages.
KEEP legacy slugs exactly as-is — only add the domain prefix:

```ts
import { MetadataRoute } from 'next'

const BASE = 'https://www.cosscloudsol.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages = [
    { url: `${BASE}`,                          priority: 1.0,  changeFrequency: 'weekly'  },
    { url: `${BASE}/courses`,                  priority: 0.9,  changeFrequency: 'weekly'  },
    { url: `${BASE}/free-demo-class`,          priority: 0.9,  changeFrequency: 'monthly' },
    { url: `${BASE}/enroll-now-with-coss`,     priority: 0.9,  changeFrequency: 'monthly' },
    { url: `${BASE}/about`,                    priority: 0.7,  changeFrequency: 'monthly' },
    { url: `${BASE}/contact`,                  priority: 0.7,  changeFrequency: 'monthly' },
    { url: `${BASE}/placements`,               priority: 0.7,  changeFrequency: 'monthly' },
    { url: `${BASE}/certification`,            priority: 0.7,  changeFrequency: 'monthly' },
    { url: `${BASE}/corporate`,                priority: 0.6,  changeFrequency: 'monthly' },
    { url: `${BASE}/batches`,                  priority: 0.6,  changeFrequency: 'weekly'  },
    { url: `${BASE}/jobs`,                     priority: 0.6,  changeFrequency: 'weekly'  },
  ]

  // LEGACY category pages — URLs MUST NOT CHANGE (indexed in Search Console)
  const legacyCategories = [
    'data-analytics-bi',
    'cloud-computing',
    'devops-multi-cloud',
    'programming-full-stack',
    'data-engineering',
    'cyber-security',
    'erp-crm-enterprise-tools',
    'software-testing-os',
    'digital-design',
    'professional-soft-skills',
  ].map(slug => ({
    url: `${BASE}/courses/${slug}`,
    priority: 0.85,
    changeFrequency: 'weekly' as const,
    lastModified: now,
  }))

  // New admin-added category pages
  const newCategories = [
    'human-resource',
    'quantum-computing',
    'medical-coding',
  ].map(slug => ({
    url: `${BASE}/courses/${slug}`,
    priority: 0.8,
    changeFrequency: 'weekly' as const,
    lastModified: now,
  }))

  return [
    ...staticPages.map(p => ({ ...p, lastModified: now, changeFrequency: p.changeFrequency as any })),
    ...legacyCategories,
    ...newCategories,
  ]
}
```

---

## STEP 4 — JSON-LD Schema (homepage + layout)

### 4A — Add to src/app/layout.tsx (global — all pages)
Add inside the <head> via Next.js Script or directly in layout:

```tsx
// Add this inside the <body> before </body> in layout.tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": "Coss Cloud Solutions",
      "alternateName": "COSS",
      "url": "https://www.cosscloudsol.com",
      "logo": "https://www.cosscloudsol.com/logo.png",
      "description": "Best IT training institute in Hyderabad offering Data Science, AWS, DevOps, SAP, Full Stack and 30+ courses with expert trainers and 100% placement support.",
      "telephone": ["+91-88851-66007", "+91-77807-27374"],
      "email": "info@cosscloudsol.com",
      "foundingDate": "2010",
      "sameAs": [
        "https://www.facebook.com/CossCloudSolutions/",
        "https://www.linkedin.com/company/coss-cloud-solutions"
      ],
      "location": [
        {
          "@type": "Place",
          "name": "Dilsukhnagar Branch",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Flat 109, CB Eastern Homes, Kamala Nagar",
            "addressLocality": "Dilsukhnagar",
            "addressRegion": "Telangana",
            "postalCode": "500060",
            "addressCountry": "IN"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 17.3694,
            "longitude": 78.5247
          }
        },
        {
          "@type": "Place",
          "name": "Ameerpet Branch",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "#502, Sree Swathi Ankur Building, Besides Aditya Trade Center",
            "addressLocality": "Ameerpet",
            "addressRegion": "Telangana",
            "postalCode": "500038",
            "addressCountry": "IN"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 17.4375,
            "longitude": 78.4483
          }
        }
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "IT Training Courses",
        "numberOfItems": 36
      }
    })
  }}
/>
```

### 4B — Add LocalBusiness schema to homepage (src/app/page.tsx)
Add a second JSON-LD block for LocalBusiness (for map pack ranking):

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": "https://www.cosscloudsol.com/#dilsukhnagar",
      "name": "Coss Cloud Solutions — Dilsukhnagar",
      "image": "https://www.cosscloudsol.com/og-image.jpg",
      "priceRange": "₹₹",
      "telephone": "+91-88851-66007",
      "url": "https://www.cosscloudsol.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Flat 109, CB Eastern Homes, Kamala Nagar",
        "addressLocality": "Dilsukhnagar",
        "addressRegion": "Telangana",
        "postalCode": "500060",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 17.3694,
        "longitude": 78.5247
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
          "opens": "09:00",
          "closes": "21:00"
        }
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "500",
        "bestRating": "5"
      }
    })
  }}
/>
```

---

## STEP 5 — Page metadata for LEGACY category pages

For each legacy category page, ADD or UPDATE the metadata export.
DO NOT change any other content, layout, or URL.

Use this pattern for each page:

### data-analytics-bi/page.tsx
```ts
export const metadata: Metadata = {
  title: 'Data Analytics & BI Training in Hyderabad',
  description: 'Join Data Analytics & Business Intelligence training in Hyderabad at Coss Cloud Solutions. Learn Power BI, Tableau, SQL, Python & ML with expert trainers, live projects, and 100% placement support.',
  alternates: {
    canonical: 'https://www.cosscloudsol.com/courses/data-analytics-bi',
  },
  openGraph: {
    title: 'Data Analytics & BI Training in Hyderabad | Coss Cloud Solutions',
    description: 'Master Data Analytics, Power BI, Tableau and ML in Hyderabad. Expert trainers, hands-on labs, placement support at Coss Cloud Solutions.',
    url: 'https://www.cosscloudsol.com/courses/data-analytics-bi',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
}
```

Apply the same pattern to ALL 10 legacy pages with these titles/descriptions:

| Slug | Title | Description (150 chars max) |
|------|-------|---------------------------|
| cloud-computing | Cloud Computing Training in Hyderabad | AWS, Azure & Google Cloud training in Hyderabad. Hands-on labs, certification prep & placement support at Coss Cloud Solutions. |
| devops-multi-cloud | DevOps & Multi-Cloud Training in Hyderabad | Master CI/CD, Docker, Kubernetes & multi-cloud DevOps in Hyderabad. Industry trainers, live projects at Coss Cloud Solutions. |
| programming-full-stack | Full Stack Development Training in Hyderabad | Learn Full Stack, Java, Python & web development in Hyderabad. Build real projects with expert guidance at Coss Cloud Solutions. |
| data-engineering | Data Engineering Training in Hyderabad | Data Engineering with Spark, Kafka, Airflow & cloud pipelines in Hyderabad. Job-ready training at Coss Cloud Solutions. |
| cyber-security | Cyber Security Training in Hyderabad | Ethical Hacking, Cyber Security & Networking courses in Hyderabad. CEH exam prep & placement at Coss Cloud Solutions. |
| erp-crm-enterprise-tools | SAP & ERP Training in Hyderabad | SAP FICO, Oracle HCM & Salesforce training in Hyderabad. Consultant-level ERP courses at Coss Cloud Solutions. |
| software-testing-os | Software Testing Training in Hyderabad | Manual & Automation Testing, Selenium & QA courses in Hyderabad. Job-ready training at Coss Cloud Solutions. |
| digital-design | Digital Marketing & Design Training in Hyderabad | Digital Marketing, UI/UX & Design courses in Hyderabad. Practical, placement-focused at Coss Cloud Solutions. |
| professional-soft-skills | Professional Skills Training in Hyderabad | Communication, leadership & soft skills courses in Hyderabad for IT professionals. Enroll at Coss Cloud Solutions. |

---

## STEP 6 — GEO: Verify NAP consistency in footer and contact

Open src/components/SiteFooter.tsx (or wherever footer is defined).
Ensure the addresses match EXACTLY:

```
Dilsukhnagar: Flat 109, CB Eastern Homes, Kamala Nagar,
              Dilsukhnagar, Hyderabad – 500060

Ameerpet:     #502, Sree Swathi Ankur Building,
              Besides Aditya Trade Center,
              Ameerpet, Hyderabad – 500038

Phone 1:  +91 88851 66007
Phone 2:  +91 77807 27374
Email:    info@cosscloudsol.com
```

Also check src/app/contact/page.tsx if it exists — same addresses.
Do NOT change layout, only correct text if wrong.

---

## STEP 7 — next.config.ts: security headers + domain config

Add these to next.config.ts:

```ts
const nextConfig = {
  // ... existing config

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },

  // Redirect non-www to www (add only if not already present)
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'cosscloudsol.com' }],
        destination: 'https://www.cosscloudsol.com/:path*',
        permanent: true,
      },
    ]
  },
}
```

---

## STEP 8 — Build and verify

```bash
npm run build
```

Check for TypeScript errors.
After build check these URLs:
- http://localhost:3000/sitemap.xml  → should list all URLs with cosscloudsol.com
- http://localhost:3000/robots.txt   → should show Sitemap: https://www.cosscloudsol.com/sitemap.xml
- http://localhost:3000/courses/data-analytics-bi → page title in browser tab
- View source → search for "EducationalOrganization" → JSON-LD present

---

## STEP 9 — Commit and push

```bash
git add -A
git commit -m "seo: add metadataBase, sitemap, robots, JSON-LD schema, canonical URLs and GEO metadata for all pages"
git push origin main
```

---

## WHAT NOT TO TOUCH

- Any page file name or folder name under src/app/courses/
- Any href or Link href pointing to legacy slugs
- Any existing form logic, API routes, or database calls
- The admin panel routes
- Any existing redirects already in next.config.ts
- courseData.ts, CourseCard.tsx, CourseGrid.tsx

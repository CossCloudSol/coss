import type { Metadata } from 'next';
import { Raleway, Roboto } from 'next/font/google';

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-raleway',
  display: 'swap',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
});

import './globals.css';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import AnnouncementBar from '@/components/AnnouncementBar';
import TopInfoBar from '@/components/TopInfoBar';
import PublicChrome from '@/components/PublicChrome';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import FirstTouchCapture from '@/components/FirstTouchCapture';
import MobileStickyBar from '@/components/MobileStickyBar';
import MobileTabBar from '@/components/MobileTabBar';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import {
  fromDbRow,
  ANNOUNCEMENT_BAR_DEFAULTS,
  type AnnouncementBarInput,
} from '@/lib/validations/announcement-bar';
import { buildGlobalSchemas } from '@/lib/global-schemas';
import { sanitizeGscVerificationId } from '@/lib/get-page-seo';
import { CATEGORY_SLUG_MAP } from '@/lib/course-url';
import { COURSE_GROUPS } from '@/data/course-options';
import { ThemeProvider } from '@/components/ThemeProvider';
import { safeJsonLd } from '@/lib/safe-json-ld';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Coss Cloud Solutions — IT Training Institute in Hyderabad',
    template: '%s | Coss Cloud Solutions',
  },
  description:
    'Best IT training institute in Hyderabad with expert trainers, hands-on labs, and placement support. Courses in Data Science, AWS, DevOps, SAP, Full Stack & more.',
  keywords: ['IT training Hyderabad', 'software training Hyderabad', 'data science course Hyderabad', 'AWS training Hyderabad', 'DevOps training Hyderabad', 'Coss Cloud Solutions'],
  authors: [{ name: 'Coss Cloud Solutions' }],
  creator: 'Coss Cloud Solutions',
  publisher: 'Coss Cloud Solutions',
  // Square, right-sized icons generated from /logo.png (which is 547×456,
  // 120 KB — not square, and heavy for a tab icon). Google requires a square
  // favicon for search results; 96×96 is a recommended multiple of 48.
  icons: {
    icon: [
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon-96x96.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
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
    site: '@DsnrCoss',
    creator: '@DsnrCoss',
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
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  other: {
    'geo.region': 'IN-TG',
    'geo.placename': 'Hyderabad',
    'geo.position': '17.3850;78.4867',
    'ICBM': '17.3850, 78.4867',
  },
};

interface SiteSettings {
  gaId: string;
  gscId: string;
}

/**
 * Pull the singleton SeoSettings row for GA4 ID and GSC verification tag.
 * Swallows DB errors — a fresh deploy before migrations run shouldn't crash.
 */
const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      const settings = await prisma.seoSettings.findFirst();
      return {
        gaId: settings?.googleAnalyticsId ?? '',
        gscId: settings?.googleSearchConsoleId ? sanitizeGscVerificationId(settings.googleSearchConsoleId) : '',
      };
    } catch {
      return { gaId: '', gscId: '' };
    }
  },
  ['seo-settings'],
  { tags: ['seo-settings'], revalidate: 86400 },
);

/**
 * Pull the AnnouncementBar singleton at request time so the component
 * receives its config as a prop (no client-side fetch needed).
 * Swallows DB errors the same way getSiteGaId() does — on a fresh deploy
 * the bar simply stays hidden rather than crashing the layout.
 */
const getAnnouncementBarConfig = unstable_cache(
  async (): Promise<AnnouncementBarInput> => {
    try {
      const row = await prisma.announcementBar.findFirst();
      if (!row) return ANNOUNCEMENT_BAR_DEFAULTS;
      return fromDbRow(row);
    } catch {
      return ANNOUNCEMENT_BAR_DEFAULTS;
    }
  },
  ['announcement-bar'],
  { tags: ['announcement-bar'], revalidate: 86400 },
);

interface NavCategory {
  name: string;
  slug: string;
}

/**
 * Published course categories for the header's Courses menu. Rendered into
 * the cached page HTML so the menu no longer depends on a client-side
 * /api/categories call (an uncached serverless + DB hit on every page view).
 * Admin category writes call revalidateTag('categories').
 *
 * No try/catch inside the cached function: a thrown error is not cached, so a
 * transient DB failure can't pin an empty menu into the data cache for a day.
 */
const getNavCategoriesCached = unstable_cache(
  async (): Promise<NavCategory[]> =>
    prisma.courseCategory.findMany({
      where: { status: 'published' },
      orderBy: { sortOrder: 'asc' },
      select: { name: true, slug: true },
    }),
  ['nav-categories'],
  { tags: ['categories'], revalidate: 86400 },
);

async function getNavCategories(): Promise<NavCategory[]> {
  try {
    return await getNavCategoriesCached();
  } catch {
    // DB unreachable: fall back to the 10 fixed legacy categories rather than
    // rendering an empty Courses menu.
    return Object.entries(CATEGORY_SLUG_MAP).map(([name, slug]) => ({ name, slug }));
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ gaId, gscId }, announcementConfig, navCategories] = await Promise.all([
    getSiteSettings(),
    getAnnouncementBarConfig(),
    getNavCategories(),
  ]);

  const globalSchemas = await buildGlobalSchemas();

  return (
    <html lang="en" suppressHydrationWarning className={`${raleway.variable} ${roboto.variable}`}>
      <head>
        {/* Theme init — synchronous, prevents dark-mode flash on first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var saved=localStorage.getItem('theme');var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;if(saved==='dark'||(!saved&&prefersDark)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />

        {/* Google Search Console ownership verification — rendered on every page */}
        {gscId && <meta name="google-site-verification" content={gscId} />}

        {/* Theme color for mobile browser chrome */}
        <meta name="theme-color" content="#005663" />
        <meta name="msapplication-TileColor" content="#005663" />

        {/* Mobile web-app capability */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Coss Cloud Solutions" />

        {/* Fonts are served by next/font from /_next/static — no external requests */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Global JSON-LD schemas: Organization, WebSite.
            Injected on every page — powers Knowledge Panel, Sitelinks Search
            Box, and AI-engine entity resolution (GEO). Branch LocalBusiness
            schema is emitted per-page on /locations/{branch} only. */}
        {globalSchemas.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
          />
        ))}
      </head>
      <body className="pb-16 md:pb-0">
        <ThemeProvider>
        <PublicChrome>
        {/* Announcement bar + teal info bar — scroll away naturally */}
        <AnnouncementBar initialConfig={announcementConfig} />
        <TopInfoBar />
        {/* Sticky chrome — only the white navbar pins to top while scrolling */}
        <div className="sticky-chrome">
          <SiteHeader categories={navCategories} />
        </div>
        <MobileTabBar />
        </PublicChrome>

        {/* Main */}
        <main>{children}</main>

        <PublicChrome>
        {/* Footer */}
        <Footer />

        {/* Google Analytics — public routes only. PublicChrome short-circuits
            to null on /admin/*. The GA component itself renders nothing when
            the admin hasn't set a Measurement ID in /admin/seo. */}
        <GoogleAnalytics gaId={gaId} />

        {/* First-touch attribution capture — public routes only.
            PublicChrome short-circuits to null on /admin/*. Renders nothing. */}
        <FirstTouchCapture />

        {/* Floating WhatsApp lead-capture widget — public routes only.
            PublicChrome short-circuits to null on /admin/*. */}
        <WhatsAppWidget courseGroups={COURSE_GROUPS} />
        <MobileStickyBar />
        </PublicChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}

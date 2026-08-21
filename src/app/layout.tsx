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
import { ThemeProvider } from '@/components/ThemeProvider';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Coss Cloud Solutions — IT Training Institute in Hyderabad',
    template: '%s | Coss Cloud Solutions',
  },
  description:
    'Best IT training institute in Hyderabad with expert trainers, hands-on labs, and 100% placement support. Courses in Data Science, AWS, DevOps, SAP, Full Stack & more.',
  keywords: ['IT training Hyderabad', 'software training Hyderabad', 'data science course Hyderabad', 'AWS training Hyderabad', 'DevOps training Hyderabad', 'Coss Cloud Solutions'],
  authors: [{ name: 'Coss Cloud Solutions' }],
  creator: 'Coss Cloud Solutions',
  publisher: 'Coss Cloud Solutions',
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: '/logo.png',
    shortcut: '/logo.png',
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
  { tags: ['seo-settings'], revalidate: 3600 },
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
  { tags: ['announcement-bar'], revalidate: 3600 },
);

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ gaId, gscId }, announcementConfig] = await Promise.all([
    getSiteSettings(),
    getAnnouncementBarConfig(),
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
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
          <SiteHeader />
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
        <WhatsAppWidget />
        <MobileStickyBar />
        </PublicChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}

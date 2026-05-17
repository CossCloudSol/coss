import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import SiteHeader from '@/components/SiteHeader';
import FooterLogo from '@/components/FooterLogo';
import AnnouncementBar from '@/components/AnnouncementBar';
import TopInfoBar from '@/components/TopInfoBar';
import PublicChrome from '@/components/PublicChrome';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { prisma } from '@/lib/db';
import {
  fromDbRow,
  ANNOUNCEMENT_BAR_DEFAULTS,
  type AnnouncementBarInput,
} from '@/lib/validations/announcement-bar';
import { buildGlobalSchemas } from '@/lib/global-schemas';
import { ThemeProvider } from '@/components/ThemeProvider';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'AI, Cloud, DevOps & Programming Training in Hyderabad | Coss Cloud Solutions',
    template: '%s | Coss Cloud Solutions',
  },
  description:
    'Best software training institute in Hyderabad. Courses in AI, Cloud Computing, DevOps, Data Science, Cyber Security & more. 100% placement assistance.',
  keywords:
    'IT training Hyderabad, software training institute Hyderabad, AI training, Cloud Computing training, DevOps training, Data Science training, Cyber Security training',
  authors: [{ name: 'COSS Cloud Solutions', url: SITE_URL }],
  creator: 'COSS Cloud Solutions',
  publisher: 'COSS Cloud Solutions',
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: '/logo.png',
    shortcut: '/logo.png',
  },
  openGraph: {
    siteName: 'COSS Cloud Solutions',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'COSS Cloud Solutions — IT Training Institute in Hyderabad',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@DsnrCoss',
    creator: '@DsnrCoss',
    images: [{ url: '/logo.png', alt: 'COSS Cloud Solutions — IT Training Institute in Hyderabad' }],
  },
  // Ensures the full site can be indexed and Google can follow all links
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
  // Geo targeting for Hyderabad / India searches
  other: {
    'geo.region': 'IN-TG',
    'geo.placename': 'Hyderabad',
    'geo.position': '17.3850;78.4867',
    'ICBM': '17.3850, 78.4867',
  },
};

const footerCourses = [
  { label: 'Artificial Intelligence (AI)', href: '/artificial-intelligence-ai-training-institute-in-hyderabad/' },
  { label: 'Data Science', href: '/courses/data-analytics-bi/' },
  { label: 'Data Analytics', href: '/courses/data-analytics-bi/' },
  { label: 'Cloud Computing', href: '/courses/cloud-computing/' },
  { label: 'DevOps', href: '/courses/devops-multi-cloud/' },
  { label: 'Ethical Hacking', href: '/courses/cyber-security/' },
  { label: 'Full Stack Power BI', href: '/full-stack-power-bi-training-institute-in-hyderabad/' },
  { label: 'Azure Data Engineer', href: '/courses/data-engineering/' },
  { label: 'SQL/MySQL/PostgreSQL', href: '/sql-mysql-postgresql-training-in-hyderabad/' },
  { label: 'SAP Fico', href: '/sap-fico-training-institute-in-hyderabad/' },
];

interface SiteSettings {
  gaId: string;
  gscId: string;
}

/**
 * Pull the singleton SeoSettings row for GA4 ID and GSC verification tag.
 * Swallows DB errors — a fresh deploy before migrations run shouldn't crash.
 */
async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const settings = await prisma.seoSettings.findFirst();
    return {
      gaId: settings?.googleAnalyticsId ?? '',
      gscId: settings?.googleSearchConsoleId ?? '',
    };
  } catch {
    return { gaId: '', gscId: '' };
  }
}

/**
 * Pull the AnnouncementBar singleton at request time so the component
 * receives its config as a prop (no client-side fetch needed).
 * Swallows DB errors the same way getSiteGaId() does — on a fresh deploy
 * the bar simply stays hidden rather than crashing the layout.
 */
async function getAnnouncementBarConfig(): Promise<AnnouncementBarInput> {
  try {
    const row = await prisma.announcementBar.findFirst();
    if (!row) return ANNOUNCEMENT_BAR_DEFAULTS;
    return fromDbRow(row);
  } catch {
    return ANNOUNCEMENT_BAR_DEFAULTS;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ gaId, gscId }, announcementConfig] = await Promise.all([
    getSiteSettings(),
    getAnnouncementBarConfig(),
  ]);

  const globalSchemas = buildGlobalSchemas();

  return (
    <html lang="en" suppressHydrationWarning>
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
        <meta name="apple-mobile-web-app-title" content="COSS Cloud Solutions" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700;800&family=Roboto:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Global JSON-LD schemas: Organization, WebSite, LocalBusiness (×2)
            Injected on every page — powers Knowledge Panel, Local Pack, and
            AI-engine entity resolution (GEO). */}
        {globalSchemas.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body>
        <ThemeProvider>
        <PublicChrome>
        {/* Announcement bar + teal info bar — scroll away naturally */}
        <AnnouncementBar initialConfig={announcementConfig} />
        <TopInfoBar />
        {/* Sticky chrome — only the white navbar pins to top while scrolling */}
        <div className="sticky-chrome">
          <SiteHeader />
        </div>
        </PublicChrome>

        {/* Main */}
        <main>{children}</main>

        <PublicChrome>
        {/* Footer */}
        <footer className="site-footer">
          <div className="footer-grid">
            {/* Brand */}
            <div className="footer-col">
              <FooterLogo />
              <p className="footer-desc">Leading IT training institute in Hyderabad. Expert trainers, practical labs, 100% placement support.</p>
              <div className="footer-contact">
                <p>📍 <strong>Dilsukhnagar:</strong> Flat 109, C.B Eastern Homes, Srinagar Colony, Hyderabad – 500060</p>
                <p>📍 <strong>Ameerpet:</strong> #502, Sree Swathi Ankur Building, Ameerpet, Hyderabad – 500038</p>
                <p>📞 <a href="tel:+918885166007">+91 88851 66007 – 77807 27374</a></p>
                <p>✉ <a href="mailto:info@cosscloudsol.com">info@cosscloudsol.com</a></p>

                {/* ── Social Media Icons ── */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                  {/* Facebook */}
                  <a href="https://www.facebook.com/CossCloudSolutions/" target="_blank" rel="noopener noreferrer"
                    className="footer-social-icon" style={{ background: '#1877F2' }}
                    aria-label="Facebook">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                  </a>
                  {/* X / Twitter */}
                  <a href="https://x.com/DsnrCoss" target="_blank" rel="noopener noreferrer"
                    className="footer-social-icon" style={{ background: '#000000' }}
                    aria-label="X (Twitter)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  {/* Instagram */}
                  <a href="https://www.instagram.com/cosscloudsolutionshyd/" target="_blank" rel="noopener noreferrer"
                    className="footer-social-icon" style={{ background: '#E1306C' }}
                    aria-label="Instagram">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                  </a>
                  {/* YouTube */}
                  <a href="https://www.youtube.com/@cossdsnr-b5e" target="_blank" rel="noopener noreferrer"
                    className="footer-social-icon" style={{ background: '#FF0000' }}
                    aria-label="YouTube">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58a2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>
                    </svg>
                  </a>
                  {/* LinkedIn */}
                  <a href="https://www.linkedin.com/company/coss-cloud-solutions" target="_blank" rel="noopener noreferrer"
                    className="footer-social-icon" style={{ background: '#0A66C2' }}
                    aria-label="LinkedIn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                      <rect x="2" y="9" width="4" height="12"/>
                      <circle cx="4" cy="4" r="2"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Top Courses */}
            <div className="footer-col">
              <h5 className="footer-heading">Top Courses</h5>
              {footerCourses.map(c => (
                <Link key={c.href} href={c.href} className="footer-link">› {c.label}</Link>
              ))}
            </div>

            {/* About Us */}
            <div className="footer-col">
              <h5 className="footer-heading">Quick Links</h5>
              {[
                { label: 'About Us', href: '/about-us/' },
                { label: 'Why Us', href: '/why-us/' },
                { label: 'Corporate Training', href: '/corporate-training/' },
                { label: 'Placements', href: '/placements/' },
                { label: 'Student Reviews', href: '/student-reviews/' },
                { label: 'Blogs', href: '/blogs/' },
                { label: 'Privacy Policy', href: '/privacy-policy/' },
                { label: 'Terms & Conditions', href: '/terms-conditions/' },
                { label: 'Contact Us', href: '/contact-us/' },
              ].map(l => (
                <Link key={l.href} href={l.href} className="footer-link">› {l.label}</Link>
              ))}
            </div>

            {/* Quick Enroll */}
            <div className="footer-col">
              <h5 className="footer-heading">Quick Enroll</h5>
              <div className="footer-form">
                <input type="text" placeholder="Your Full Name" className="footer-input" />
                <input type="tel" placeholder="Mobile Number" className="footer-input" />
                <select className="footer-select">
                  <option value="">Select Inquiry Type</option>
                  <option>Course Enquiry</option>
                  <option>Demo Class</option>
                  <option>Corporate Training</option>
                  <option>Placement Assistance</option>
                </select>
                <Link href="/enroll-now-with-coss/" className="footer-enroll-btn">ENROLL NOW</Link>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            Copyright © {new Date().getFullYear()} - Coss Cloud Solutions. All rights reserved.
          </div>
        </footer>

        {/* Google Analytics — public routes only. PublicChrome short-circuits
            to null on /admin/*. The GA component itself renders nothing when
            the admin hasn't set a Measurement ID in /admin/seo. */}
        <GoogleAnalytics gaId={gaId} />

        {/* Floating WhatsApp lead-capture widget — public routes only.
            PublicChrome short-circuits to null on /admin/*. */}
        <WhatsAppWidget />
        </PublicChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}

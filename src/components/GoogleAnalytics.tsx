'use client';

import Script from 'next/script';

interface GoogleAnalyticsProps {
  gaId: string;
}

/**
 * Drop-in GA4 tag. Renders nothing when `gaId` is empty so the public site
 * stays untracked until the admin sets a Measurement ID in /admin/seo.
 */
export default function GoogleAnalytics({
  gaId,
}: GoogleAnalyticsProps): JSX.Element | null {
  const trimmed = gaId.trim();
  if (!trimmed || trimmed === 'G-XXXXXXXXXX') return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { page_path: window.location.pathname });
        `}
      </Script>
    </>
  );
}

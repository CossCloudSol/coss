'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { PRODUCTION_HOST } from '@/lib/production-host';

interface GoogleAnalyticsProps {
  gaId: string;
}

/**
 * Drop-in GA4 tag. Renders nothing when `gaId` is empty so the public site
 * stays untracked until the admin sets a Measurement ID in /admin/seo.
 *
 * Loading order (performance):
 * - The tiny inline stub runs afterInteractive. It defines window.gtag and
 *   queues 'js' + 'config' in dataLayer, so CallLink / WhatsAppLink /
 *   submitLead / intent-tracking events fired before the library arrives are
 *   queued instead of dropped.
 * - The gtag.js library (the heavy part) loads lazyOnload (browser idle after the
 *   window load event), so it no longer competes with page JS and images
 *   during load. On load it replays everything queued in dataLayer.
 *
 * gtag.js loads only on PRODUCTION_HOST (lib/production-host). Everywhere
 * else (Vercel previews, localhost) the stub still collects events in
 * window.dataLayer, where they can be checked, but nothing reaches the live
 * GA4 property.
 */
export default function GoogleAnalytics({
  gaId,
}: GoogleAnalyticsProps): JSX.Element | null {
  const [onProductionHost, setOnProductionHost] = useState(false);
  useEffect(() => {
    setOnProductionHost(window.location.hostname === PRODUCTION_HOST);
  }, []);

  const trimmed = gaId.trim();
  if (!trimmed || trimmed === 'G-XXXXXXXXXX') return null;
  const idLiteral = JSON.stringify(trimmed);
  return (
    <>
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', ${idLiteral}, { page_path: window.location.pathname });
        `}
      </Script>
      {onProductionHost ? (
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(trimmed)}`}
          strategy="lazyOnload"
        />
      ) : null}
    </>
  );
}

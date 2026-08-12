'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { type PageType, classifyPageType, detectDeviceType, extractUtmParams } from '@/lib/click-tracking';
import { WA_NUMBER } from '@/lib/whatsapp';

/* -------------------------------------------------------------------------- */
/*  Single source of truth for every WhatsApp CTA on the site, mirroring      */
/*  CallLink. Renders a plain <a href="https://wa.me/..."> — never delayed —  */
/*  and fires a non-blocking, fire-and-forget log of the click via            */
/*  navigator.sendBeacon (falling back to a keepalive fetch). Logging         */
/*  failure never affects the click: sendBeacon only ever queues, it doesn't  */
/*  report errors, and the fetch fallback is wrapped so a throw can't reach   */
/*  the click.                                                                */
/* -------------------------------------------------------------------------- */

export type WhatsAppCtaType =
  | 'footer' | 'hero' | 'contact_page' | 'free_demo' | 'batches_page'
  | 'batch' | 'job' | 'locality' | 'widget' | 'sticky';

function normalizeToWaDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const tenDigit = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return `91${tenDigit}`;
}

interface WhatsAppClickPayload {
  path: string;
  pageType: PageType;
  ctaType: WhatsAppCtaType;
  phoneNumber: string;
  hadPrefill: boolean;
  deviceType: 'mobile' | 'desktop';
  courseSlug?: string;
  branchKey?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

function logWhatsAppClick(payload: WhatsAppClickPayload): void {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/whatsapp-clicks', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/whatsapp-clicks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        /* best-effort — never let logging affect the click */
      });
    }
  } catch {
    /* best-effort — never let logging affect the click */
  }
}

export interface WhatsAppLinkProps {
  /** Prebuilt message text (batchBookingMessage(), jobApplyMessage(), etc.). Omit for a bare wa.me link with no text= param. */
  message?: string;
  /** Which CTA this is — required, used to tell apart the many WhatsApp buttons sharing a page/pageType. */
  ctaType: WhatsAppCtaType;
  /** Omit for global chrome (footer/widget) that has no page context — see classifyPageType. */
  pageType?: PageType;
  courseSlug?: string;
  branchKey?: string;
  /** Raw phone number in any spacing/format, e.g. a branch's own number — normalized for both the href and the logged event. Defaults to the central WA_NUMBER. */
  number?: string;
  /** Defaults to Boolean(message?.trim()) — override when a message is present but not meaningfully personalized (e.g. the widget's "skip" path), or vice versa. */
  hadPrefill?: boolean;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  children: React.ReactNode;
}

export default function WhatsAppLink({
  message,
  ctaType,
  pageType,
  courseSlug,
  branchKey,
  number,
  hadPrefill,
  className,
  style,
  'aria-label': ariaLabel,
  children,
}: WhatsAppLinkProps): JSX.Element {
  const pathname = usePathname();
  const digits = normalizeToWaDigits(number ?? WA_NUMBER);
  const href = `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

  const handleClick = useCallback(() => {
    const resolvedPath = pathname || '/';
    const payload: WhatsAppClickPayload = {
      path: resolvedPath,
      pageType: pageType ?? classifyPageType(resolvedPath),
      ctaType,
      phoneNumber: `+${digits}`,
      hadPrefill: hadPrefill ?? Boolean(message?.trim()),
      deviceType: detectDeviceType(),
    };
    if (courseSlug) payload.courseSlug = courseSlug;
    if (branchKey) payload.branchKey = branchKey;
    if (typeof document !== 'undefined' && document.referrer) payload.referrer = document.referrer;
    Object.assign(payload, extractUtmParams());

    logWhatsAppClick(payload);
  }, [pathname, pageType, ctaType, courseSlug, branchKey, digits, hadPrefill, message]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

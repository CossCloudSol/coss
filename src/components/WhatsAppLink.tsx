'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import type { PageType } from '@/lib/click-tracking';
import { buildWhatsAppClickPayload, logWhatsAppClick, toWaDigits, type WhatsAppCtaType } from '@/lib/contact-click-log';
import { TRACKED_ATTR, trackIntent } from '@/lib/intent-tracking';
import { WA_NUMBER } from '@/lib/whatsapp';
import { currentRefChannel, waHrefWithRef } from '@/lib/wa-ref';

/* -------------------------------------------------------------------------- */
/*  Single source of truth for every WhatsApp CTA on the site, mirroring      */
/*  CallLink. Renders a plain <a href="https://wa.me/..."> — never delayed —  */
/*  and fires a non-blocking, fire-and-forget log of the click (WhatsAppClick */
/*  row via sendBeacon) plus GA4 contact_click through intent-tracking.       */
/*  data-tracked tells the site-wide click listener not to count it again.    */
/* -------------------------------------------------------------------------- */

export type { WhatsAppCtaType, WhatsAppClickPayload } from '@/lib/contact-click-log';
// WhatsAppWidget's outbound click follows an async lead POST rather than a plain anchor click,
// so it logs through the same helpers instead of rendering <WhatsAppLink>.
export { buildWhatsAppClickPayload, logWhatsAppClick } from '@/lib/contact-click-log';

export interface WhatsAppLinkProps {
  /** Visible course name for the prefilled text, when this link is about one course (a batch card). Else the course comes from courseSlug or the course page's path. */
  courseName?: string;
  /** Which CTA this is — required, used to tell apart the many WhatsApp buttons sharing a page/pageType. */
  ctaType: WhatsAppCtaType;
  /** Which part of the page, e.g. "footer", "batch_card", "contact_page". */
  location: string;
  /** Which button; defaults to the ctaType. */
  ctaId?: string;
  /** Omit for global chrome (footer/widget) that has no page context — see classifyPageType. */
  pageType?: PageType;
  courseSlug?: string;
  branchKey?: string;
  /** Raw phone number in any spacing/format, e.g. a branch's own number — normalized for both the href and the logged event. Defaults to the central WA_NUMBER. */
  number?: string;
  /** Every link carries the standard prefill with a ref code (lib/wa-ref), so this defaults to true. */
  hadPrefill?: boolean;
  /** data-cta for the button (tracked links are skipped by the site-wide listener, so this only names the button in the DOM). */
  dataCta?: string;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  children: React.ReactNode;
}

export default function WhatsAppLink({
  courseName,
  ctaType,
  location,
  ctaId,
  pageType,
  courseSlug,
  branchKey,
  number,
  hadPrefill,
  dataCta,
  className,
  style,
  'aria-label': ariaLabel,
  children,
}: WhatsAppLinkProps): JSX.Element {
  const pathname = usePathname();
  const digits = toWaDigits(number ?? WA_NUMBER);
  if (number && !/^91\d{10}$/.test(digits)) {
    console.warn(`[WhatsAppLink] normalized number "${digits}" (from override "${number}") does not match the expected 91XXXXXXXXXX shape`);
  }
  // Server-rendered with channel D; the real first-touch channel is put in at click time.
  const href = waHrefWithRef(`https://wa.me/${digits}`, { pathname, courseName, courseSlug, channel: 'D' });

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.href = waHrefWithRef(href, { pathname, courseName, courseSlug, channel: currentRefChannel() });
    const id = ctaId ?? ctaType;
    logWhatsAppClick(buildWhatsAppClickPayload({
      pathname,
      pageType,
      ctaType,
      phoneNumber: `+${digits}`,
      hadPrefill: hadPrefill ?? true,
      ctaId: id,
      location,
      courseSlug,
      branchKey,
    }));
    trackIntent({ kind: 'whatsapp', ctaId: id, location, destination: `https://wa.me/${digits}`, courseSlug, pageType });
  }, [href, pathname, pageType, ctaType, ctaId, location, courseName, courseSlug, branchKey, digits, hadPrefill]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      aria-label={ariaLabel}
      onClick={handleClick}
      {...(dataCta ? { 'data-cta': dataCta } : {})}
      {...{ [TRACKED_ATTR]: '' }}
    >
      {children}
    </a>
  );
}

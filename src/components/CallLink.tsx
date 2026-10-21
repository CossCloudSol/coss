'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import type { PageType } from '@/lib/click-tracking';
import { logCallClick, toE164India } from '@/lib/contact-click-log';
import { TRACKED_ATTR, trackIntent } from '@/lib/intent-tracking';

/* -------------------------------------------------------------------------- */
/*  Single source of truth for every "tap to call" link on the site. Renders  */
/*  a plain <a href="tel:..."> — the browser's native tel: handling is never  */
/*  touched or delayed — and fires a non-blocking, fire-and-forget log of     */
/*  the click (CallClick row via sendBeacon) plus GA4 contact_click through   */
/*  intent-tracking. Logging failure never affects the call. data-tracked     */
/*  tells the site-wide click listener not to count it again.                 */
/* -------------------------------------------------------------------------- */

export type CallPageType = PageType;

export interface CallLinkProps {
  /** Raw phone number in any spacing/format — normalized to +91XXXXXXXXXX for both the href and the logged event. */
  number: string;
  /** Which button, e.g. "call" or "call_ameerpet". */
  ctaId: string;
  /** Which part of the page, e.g. "header", "footer", "sticky_bar", "course_sidebar". */
  location: string;
  /** Omit only for global chrome (header/footer/topbar/sticky bar) that has no page context — see classifyPageType. */
  pageType?: CallPageType;
  courseSlug?: string;
  branchKey?: string;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  children: React.ReactNode;
}

export default function CallLink({
  number,
  ctaId,
  location,
  pageType,
  courseSlug,
  branchKey,
  className,
  style,
  'aria-label': ariaLabel,
  children,
}: CallLinkProps): JSX.Element {
  const pathname = usePathname();
  const normalized = toE164India(number);

  const handleClick = useCallback(() => {
    logCallClick({ pathname, pageType, phoneNumber: normalized, ctaId, location, courseSlug, branchKey });
    trackIntent({ kind: 'call', ctaId, location, destination: `tel:${normalized}`, courseSlug, pageType });
  }, [pathname, pageType, courseSlug, branchKey, normalized, ctaId, location]);

  return (
    <a
      href={`tel:${normalized}`}
      className={className}
      style={style}
      aria-label={ariaLabel}
      onClick={handleClick}
      {...{ [TRACKED_ATTR]: '' }}
    >
      {children}
    </a>
  );
}

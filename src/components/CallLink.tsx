'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { type PageType, classifyPageType, detectDeviceType, extractUtmParams } from '@/lib/click-tracking';

/* -------------------------------------------------------------------------- */
/*  Single source of truth for every "tap to call" link on the site. Renders  */
/*  a plain <a href="tel:..."> — the browser's native tel: handling is never  */
/*  touched or delayed — and fires a non-blocking, fire-and-forget log of     */
/*  the click via navigator.sendBeacon (falling back to a keepalive fetch),   */
/*  mirroring the existing BlogViewBeacon pattern. Logging failure never      */
/*  affects the call: sendBeacon only ever queues, it doesn't report errors,  */
/*  and the fetch fallback is wrapped so a throw can't reach the click.       */
/* -------------------------------------------------------------------------- */

export type CallPageType = PageType;

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const tenDigit = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return `+91${tenDigit}`;
}

function logCallClick(payload: Record<string, string>): void {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/call-clicks', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/call-clicks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        /* best-effort — never let logging affect the call */
      });
    }
  } catch {
    /* best-effort — never let logging affect the call */
  }
}

export interface CallLinkProps {
  /** Raw phone number in any spacing/format — normalized to +91XXXXXXXXXX for both the href and the logged event. */
  number: string;
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
  pageType,
  courseSlug,
  branchKey,
  className,
  style,
  'aria-label': ariaLabel,
  children,
}: CallLinkProps): JSX.Element {
  const pathname = usePathname();
  const normalized = normalizePhone(number);

  const handleClick = useCallback(() => {
    const resolvedPath = pathname || '/';
    const payload: Record<string, string> = {
      path: resolvedPath,
      pageType: pageType ?? classifyPageType(resolvedPath),
      phoneNumber: normalized,
      deviceType: detectDeviceType(),
    };
    if (courseSlug) payload.courseSlug = courseSlug;
    if (branchKey) payload.branchKey = branchKey;
    if (typeof document !== 'undefined' && document.referrer) payload.referrer = document.referrer;
    Object.assign(payload, extractUtmParams());

    logCallClick(payload);
  }, [pathname, pageType, courseSlug, branchKey, normalized]);

  return (
    <a
      href={`tel:${normalized}`}
      className={className}
      style={style}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

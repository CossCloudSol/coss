'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';

/* -------------------------------------------------------------------------- */
/*  Single source of truth for every "tap to call" link on the site. Renders  */
/*  a plain <a href="tel:..."> — the browser's native tel: handling is never  */
/*  touched or delayed — and fires a non-blocking, fire-and-forget log of     */
/*  the click via navigator.sendBeacon (falling back to a keepalive fetch),   */
/*  mirroring the existing BlogViewBeacon pattern. Logging failure never      */
/*  affects the call: sendBeacon only ever queues, it doesn't report errors,  */
/*  and the fetch fallback is wrapped so a throw can't reach the click.       */
/* -------------------------------------------------------------------------- */

export type CallPageType = 'course' | 'category' | 'locality' | 'blog' | 'static';

// Matches Tailwind's `md` breakpoint (768px), already the site's own
// mobile/desktop split (see the `md:hidden` / `hidden md:flex` usages in
// SiteHeader/MobileStickyBar) — reused here instead of user-agent sniffing.
const MOBILE_BREAKPOINT_QUERY = '(max-width: 767px)';

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const tenDigit = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return `+91${tenDigit}`;
}

function detectDeviceType(): 'mobile' | 'desktop' {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'desktop';
  return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches ? 'mobile' : 'desktop';
}

// Top-level route segments that are generic static pages rather than one of
// the many individually-named course/SEO landing pages under app/. Used only
// as the fallback classifier below — see its doc comment.
const STATIC_TOP_LEVEL_SLUGS = new Set([
  'about', 'about-us', 'contact-us', 'enroll-now-with-coss', 'terms-conditions',
  'privacy-policy', 'free-demo-class', 'batches', 'blogs', 'jobs', 'certification',
  'corporate-training', 'placements', 'student-reviews', 'why-us',
]);

/**
 * Best-effort pageType inference from the URL alone. Used as a fallback for
 * call sites with no page context to pass as a prop: global chrome that
 * renders identically on every route (SiteHeader, Footer, TopInfoBar,
 * MobileStickyBar), and shared.tsx's EnrollSidebar, which is reused across
 * ~16 unrelated page types. Every call site that DOES know its own page type
 * (course/category/locality/blog pages) passes `pageType` explicitly and
 * this function never runs for them. Imprecise by nature: a top-level slug
 * that isn't a known static page or /courses|/blog|/locations prefix is
 * assumed to be one of the site's many individually-routed course landing
 * pages (e.g. /aws-devops-course-in-hyderabad-by-coss-cloud-solutions) since those
 * vastly outnumber genuine unclassified static routes.
 */
function classifyPageType(pathname: string): CallPageType {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'static';
  const [first, second] = segments;
  if (first === 'blog') return 'blog';
  if (first === 'locations') return 'locality';
  if (first === 'courses') return second ? 'course' : 'category';
  if (STATIC_TOP_LEVEL_SLUGS.has(first)) return 'static';
  return segments.length === 1 ? 'course' : 'static';
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
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
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
    const utmSource = params?.get('utm_source');
    const utmMedium = params?.get('utm_medium');
    const utmCampaign = params?.get('utm_campaign');
    if (utmSource) payload.utmSource = utmSource;
    if (utmMedium) payload.utmMedium = utmMedium;
    if (utmCampaign) payload.utmCampaign = utmCampaign;

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

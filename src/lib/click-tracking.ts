/* -------------------------------------------------------------------------- */
/*  Shared client-side helpers for click-tracking components (CallLink,       */
/*  WhatsAppLink). Extracted so both channels classify pages, detect device   */
/*  type, and read UTM params identically instead of drifting independently.  */
/* -------------------------------------------------------------------------- */

export type PageType = 'course' | 'category' | 'locality' | 'blog' | 'static';

// Matches Tailwind's `md` breakpoint (768px), already the site's own
// mobile/desktop split (see the `md:hidden` / `hidden md:flex` usages in
// SiteHeader/MobileStickyBar) — reused here instead of user-agent sniffing.
export const MOBILE_BREAKPOINT_QUERY = '(max-width: 767px)';

// Top-level route segments that are generic static pages rather than one of
// the many individually-named course/SEO landing pages under app/. Used only
// as the fallback classifier below — see its doc comment.
export const STATIC_TOP_LEVEL_SLUGS = new Set([
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
export function classifyPageType(pathname: string): PageType {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'static';
  const [first, second] = segments;
  if (first === 'blog') return 'blog';
  if (first === 'locations') return 'locality';
  if (first === 'courses') return second ? 'course' : 'category';
  if (STATIC_TOP_LEVEL_SLUGS.has(first)) return 'static';
  return segments.length === 1 ? 'course' : 'static';
}

export function detectDeviceType(): 'mobile' | 'desktop' {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'desktop';
  return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches ? 'mobile' : 'desktop';
}

/** Reads utm_source/utm_medium/utm_campaign from the current URL. Only present keys are truthy — matches the omit-if-empty behaviour callers relied on before extraction. */
export function extractUtmParams(): { utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const result: { utmSource?: string; utmMedium?: string; utmCampaign?: string } = {};
  const utmSource = params?.get('utm_source');
  const utmMedium = params?.get('utm_medium');
  const utmCampaign = params?.get('utm_campaign');
  if (utmSource) result.utmSource = utmSource;
  if (utmMedium) result.utmMedium = utmMedium;
  if (utmCampaign) result.utmCampaign = utmCampaign;
  return result;
}

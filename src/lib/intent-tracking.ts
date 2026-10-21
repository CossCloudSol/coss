/* -------------------------------------------------------------------------- */
/*  One tracker for every "intent" click: demo, syllabus/brochure, call,      */
/*  WhatsApp, enrol. Each click sends one GA4 event with the same snake_case  */
/*  parameters, logs an anonymous row for admin (demo/syllabus/brochure/      */
/*  enrol/other go to /api/cta-clicks; call and WhatsApp keep their own       */
/*  endpoints, posted by CallLink/WhatsAppLink), and remembers the click for  */
/*  30 minutes so a lead submitted afterwards records which button it came    */
/*  from. Everything is best-effort: no failure here reaches the click.       */
/*  No personal data: ids, sections, paths and the destination only.          */
/* -------------------------------------------------------------------------- */

import { classifyPageType, detectDeviceType, extractUtmParams, type PageType } from '@/lib/click-tracking';

export const INTENT_KINDS = ['demo', 'syllabus', 'brochure_download', 'call', 'whatsapp', 'enroll', 'other'] as const;
export type IntentKind = (typeof INTENT_KINDS)[number];

/** GA4 event name per kind. Call and WhatsApp share contact_click (method tells them apart). */
export const INTENT_GA_EVENT: Record<IntentKind, string> = {
  demo: 'demo_click',
  syllabus: 'syllabus_click',
  brochure_download: 'brochure_download',
  call: 'contact_click',
  whatsapp: 'contact_click',
  enroll: 'cta_click',
  other: 'cta_click',
};

export interface IntentInput {
  kind: IntentKind;
  /** Which button, e.g. "book_demo". "untagged" for the site-wide safety net. */
  ctaId: string;
  /** Which part of the page, e.g. "header", "sticky_bar", "cta_band". */
  location: string;
  /** Where the click goes: a path, tel:, or a wa.me link without its text. */
  destination: string;
  courseSlug?: string;
  pageType?: PageType;
}

/** Marks an element whose own handler already tracked the click, so the site-wide listener skips it. */
export const TRACKED_ATTR = 'data-tracked';

/* ------------------------------ Kind from href ----------------------------- */

/** The kind a link implies from where it goes; null when it isn't an intent link. */
export function inferIntentKind(href: string | null | undefined): IntentKind | null {
  if (!href) return null;
  const h = href.trim();
  if (/^tel:/i.test(h)) return 'call';
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)\b/i.test(h)) return 'whatsapp';
  const path = h.replace(/^https?:\/\/(www\.)?cosscloudsol\.com/i, '').split(/[?#]/)[0];
  if (/^\/free-demo-class\/?$/i.test(path)) return 'demo';
  if (/syllabus|brochure/i.test(h)) return 'syllabus';
  if (/^\/enroll-now-with-coss\/?$/i.test(path)) return 'enroll';
  return null;
}

/** A button or section id as the endpoints accept it: snake_case, at most 60 characters. */
export function toTrackingId(raw: string | null | undefined, fallback = 'page'): string {
  const id = (raw ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
  return id || fallback;
}

/** A destination safe to log: no query string (a wa.me ?text= can carry a course or a name). */
export function cleanDestination(href: string): string {
  return href.trim().split(/[?#]/)[0].slice(0, 300);
}

/* ------------------------------ GA4 parameters ----------------------------- */

export function intentGaParams(input: IntentInput, pagePath: string): Record<string, string> {
  const params: Record<string, string> = {
    cta_id: input.ctaId,
    location: input.location,
    destination: cleanDestination(input.destination),
    page_path: pagePath,
    page_type: input.pageType ?? classifyPageType(pagePath),
  };
  if (input.courseSlug) params.course_slug = input.courseSlug;
  if (input.kind === 'call' || input.kind === 'whatsapp') params.method = input.kind;
  return params;
}

function gtagEvent(name: string, params: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  if (typeof (window as any).gtag !== 'function') return;
  try {
    // The click often navigates away at once; beacon lets the hit survive it.
    (window as any).gtag('event', name, { ...params, transport_type: 'beacon' });
  } catch {
    /* best-effort */
  }
}

/* ------------------------------ Last click (30 min) ------------------------ */

export const LAST_CLICK_KEY = 'coss_last_cta';
export const LAST_CLICK_TTL_MS = 30 * 60 * 1000;

export interface LastClick {
  kind: IntentKind;
  ctaId: string;
  location: string;
  path: string;
  at: number;
}

export function rememberLastClick(click: Omit<LastClick, 'at'>, now: number = Date.now()): void {
  try {
    window.sessionStorage.setItem(LAST_CLICK_KEY, JSON.stringify({ ...click, at: now }));
  } catch {
    /* storage blocked or full */
  }
}

/** The last intent click if it was under 30 minutes ago, else null. */
export function readLastClick(now: number = Date.now()): LastClick | null {
  try {
    const raw = window.sessionStorage.getItem(LAST_CLICK_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Partial<LastClick>;
    if (typeof c.at !== 'number' || now - c.at > LAST_CLICK_TTL_MS || now < c.at) return null;
    if (typeof c.ctaId !== 'string' || typeof c.location !== 'string' || typeof c.path !== 'string') return null;
    return c as LastClick;
  } catch {
    return null;
  }
}

/** Lead-body fields for the source button: sourceCta, sourceLocation, sourcePath (empty when none). */
export function leadSourceFields(now: number = Date.now()): { sourceCta?: string; sourceLocation?: string; sourcePath?: string } {
  const c = readLastClick(now);
  return c ? { sourceCta: c.ctaId, sourceLocation: c.location, sourcePath: c.path } : {};
}

/* ------------------------------ Beacon ------------------------------------- */

export function beacon(url: string, payload: object): void {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {
        /* best-effort */
      });
    }
  } catch {
    /* best-effort */
  }
}

/* ------------------------------ Track -------------------------------------- */

/**
 * GA4 event + last-click memory for any kind, plus a CtaClick row for the kinds that have no
 * endpoint of their own. Call and WhatsApp rows are posted by CallLink / WhatsAppLink (they
 * carry the phone number the endpoints check), so those kinds skip the row by default.
 * `remember: false` leaves the remembered source click as it was.
 */
export function trackIntent(raw: IntentInput, opts: { logRow?: boolean; remember?: boolean } = {}): void {
  if (typeof window === 'undefined') return;
  const input = { ...raw, ctaId: toTrackingId(raw.ctaId, 'untagged'), location: toTrackingId(raw.location) };
  const path = window.location.pathname || '/';
  gtagEvent(INTENT_GA_EVENT[input.kind], intentGaParams(input, path));
  // A form's own submit button keeps the button that brought the visitor as the lead's source.
  if (opts.remember !== false) rememberLastClick({ kind: input.kind, ctaId: input.ctaId, location: input.location, path });
  const logRow = opts.logRow ?? (input.kind !== 'call' && input.kind !== 'whatsapp');
  if (!logRow) return;
  const payload: Record<string, string> = {
    kind: input.kind,
    ctaId: input.ctaId,
    location: input.location,
    path,
    pageType: input.pageType ?? classifyPageType(path),
    destination: cleanDestination(input.destination),
    deviceType: detectDeviceType(),
  };
  if (input.courseSlug) payload.courseSlug = input.courseSlug;
  if (document.referrer) payload.referrer = document.referrer.slice(0, 500);
  Object.assign(payload, extractUtmParams());
  const gclid = new URLSearchParams(window.location.search).get('gclid');
  if (gclid) payload.gclid = gclid.slice(0, 255);
  beacon('/api/cta-clicks', payload);
}

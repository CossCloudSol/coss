/* -------------------------------------------------------------------------- */
/*  The one site-wide click listener (installed by PublicChrome, public pages */
/*  only, capture phase so it sees clicks before navigation). It covers the   */
/*  CTAs that are plain server-rendered links:                                */
/*   - [data-cta] elements: trackIntent with data-cta, data-loc and           */
/*     data-kind (else the kind implied by the href), data-course for the     */
/*     course slug; data-keep-source on a form's submit button counts it      */
/*     without replacing the remembered source button;                       */
/*   - safety net: untagged links to /free-demo-class, a syllabus/brochure or */
/*     wa.me count as cta_id "untagged", location = the nearest section;     */
/*   - anything inside [data-tracked] is skipped: its own handler (CallLink, */
/*     WhatsAppLink, TrackedCta, PromoBanner) already counted it.            */
/*  Server-rendered tel: and wa.me links also get their CallClick /           */
/*  WhatsAppClick row here.                                                   */
/* -------------------------------------------------------------------------- */

import { INTENT_KINDS, TRACKED_ATTR, inferIntentKind, trackIntent, type IntentInput, type IntentKind } from '@/lib/intent-tracking';
import { WHATSAPP_CTA_TYPES, buildWhatsAppClickPayload, logCallClick, logWhatsAppClick, toE164India, type WhatsAppCtaType } from '@/lib/contact-click-log';

/** The small slice of the DOM this file uses, so it can be tested without a browser. */
export interface ElementLike {
  tagName: string;
  id?: string;
  parentElement: ElementLike | null;
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
}

/** Kinds the safety net counts when a link carries no data-cta. */
const SAFETY_NET_KINDS: ReadonlySet<IntentKind> = new Set(['demo', 'syllabus', 'whatsapp']);

function ancestor(el: ElementLike | null, pred: (e: ElementLike) => boolean): ElementLike | null {
  for (let n = el; n; n = n.parentElement) if (pred(n)) return n;
  return null;
}

/** Nearest data-section, else the nearest <section id>, else header/footer/nav, else "page". */
export function sectionOf(el: ElementLike): string {
  for (let n: ElementLike | null = el; n; n = n.parentElement) {
    const named = n.getAttribute('data-section');
    if (named) return named;
    const tag = n.tagName.toLowerCase();
    if (tag === 'section' && n.id) return n.id;
    if (tag === 'header' || tag === 'footer' || tag === 'nav') return tag;
  }
  return 'page';
}

export interface ResolvedIntent extends IntentInput {
  href: string;
  /** data-keep-source: count the click but keep the remembered source button (form submits). */
  keepSource: boolean;
  /** data-wa-type on a server-rendered WhatsApp link (the WhatsAppClick ctaType). */
  waType: WhatsAppCtaType;
}

function isKind(v: string | null): v is IntentKind {
  return v !== null && (INTENT_KINDS as ReadonlyArray<string>).includes(v);
}

/** What a click on `target` should count as, or null for none. */
export function resolveIntent(target: ElementLike | null): ResolvedIntent | null {
  if (!target || ancestor(target, (e) => e.hasAttribute(TRACKED_ATTR))) return null;

  const tagged = ancestor(target, (e) => e.hasAttribute('data-cta'));
  const link = tagged ?? ancestor(target, (e) => e.tagName.toLowerCase() === 'a' && e.hasAttribute('href'));
  if (!link) return null;

  const href = link.getAttribute('href') ?? '';
  const dataKind = link.getAttribute('data-kind');
  const kind = isKind(dataKind) ? dataKind : inferIntentKind(href);
  const wa = link.getAttribute('data-wa-type');
  const waType = WHATSAPP_CTA_TYPES.includes(wa as WhatsAppCtaType) ? (wa as WhatsAppCtaType) : 'other';
  const courseSlug = link.getAttribute('data-course') || undefined;

  if (tagged) {
    return {
      kind: kind ?? 'other',
      ctaId: tagged.getAttribute('data-cta') || 'untagged',
      location: tagged.getAttribute('data-loc') || sectionOf(tagged),
      destination: href || '#',
      courseSlug,
      href,
      waType,
      keepSource: tagged.hasAttribute('data-keep-source'),
    };
  }
  if (!kind || !SAFETY_NET_KINDS.has(kind)) return null;
  return { kind, ctaId: 'untagged', location: sectionOf(link), destination: href, courseSlug, href, waType, keepSource: false };
}

/** Counts one click: GA4 + last-click memory + its admin row. */
export function countIntent(intent: ResolvedIntent, pathname: string): void {
  trackIntent(intent, { remember: !intent.keepSource });
  if (intent.kind === 'whatsapp') {
    const phone = intent.href.match(/wa\.me\/(\d{10,12})/)?.[1];
    if (phone) {
      logWhatsAppClick(buildWhatsAppClickPayload({
        pathname,
        ctaType: intent.waType,
        phoneNumber: toE164India(phone),
        hadPrefill: /[?&]text=/.test(intent.href),
        ctaId: intent.ctaId,
        location: intent.location,
        courseSlug: intent.courseSlug,
      }));
    }
  } else if (intent.kind === 'call') {
    const phone = intent.href.replace(/^tel:/i, '');
    if (phone) logCallClick({ pathname, phoneNumber: toE164India(phone), ctaId: intent.ctaId, location: intent.location, courseSlug: intent.courseSlug });
  }
}

/** Adds the capture-phase listener; returns the remover. */
export function installIntentListener(): () => void {
  const onClick = (e: MouseEvent): void => {
    try {
      const intent = resolveIntent(e.target instanceof Element ? (e.target as unknown as ElementLike) : null);
      if (!intent) return;
      // An earlier handler kept the link from opening (the homepage "Send me the plan" opens the
      // WhatsApp widget instead, which logs its own click): count the button, not a WhatsApp/call.
      if (e.defaultPrevented && (intent.kind === 'whatsapp' || intent.kind === 'call')) intent.kind = 'other';
      countIntent(intent, window.location.pathname);
    } catch {
      /* best-effort — never let tracking affect the click */
    }
  };
  document.addEventListener('click', onClick, true);
  return () => document.removeEventListener('click', onClick, true);
}

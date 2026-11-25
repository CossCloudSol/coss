/* -------------------------------------------------------------------------- */
/*  Admin rows for call and WhatsApp clicks (/api/call-clicks and              */
/*  /api/whatsapp-clicks). Shared by CallLink, WhatsAppLink, the WhatsApp      */
/*  widget and the site-wide click listener (server-rendered tel: / wa.me      */
/*  anchors). Fire-and-forget beacons: logging never delays or blocks the      */
/*  click. GA4 is intent-tracking's job, not this file's.                      */
/* -------------------------------------------------------------------------- */

import { type PageType, classifyPageType, detectDeviceType, extractUtmParams } from '@/lib/click-tracking';
import { beacon, toTrackingId } from '@/lib/intent-tracking';

export type WhatsAppCtaType =
  | 'footer' | 'hero' | 'contact_page' | 'free_demo' | 'batches_page'
  | 'batch' | 'job' | 'locality' | 'widget' | 'sticky' | 'other';

export const WHATSAPP_CTA_TYPES: ReadonlyArray<WhatsAppCtaType> = [
  'footer', 'hero', 'contact_page', 'free_demo', 'batches_page',
  'batch', 'job', 'locality', 'widget', 'sticky', 'other',
];

/** "+91XXXXXXXXXX" from any spacing of a 10-digit or 91-prefixed number. */
export function toE164India(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const tenDigit = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return `+91${tenDigit}`;
}

/** "91XXXXXXXXXX" for a wa.me link. */
export function toWaDigits(raw: string): string {
  return toE164India(raw).slice(1);
}

function pageContext(pathname: string | null, pageType?: PageType) {
  const path = pathname || '/';
  const ctx: Record<string, string> = {
    path,
    pageType: pageType ?? classifyPageType(path),
    deviceType: detectDeviceType(),
  };
  if (typeof document !== 'undefined' && document.referrer) ctx.referrer = document.referrer;
  Object.assign(ctx, extractUtmParams());
  return ctx;
}

export interface WhatsAppClickPayload {
  path: string;
  pageType: PageType;
  ctaType: WhatsAppCtaType;
  phoneNumber: string;
  hadPrefill: boolean;
  deviceType: 'mobile' | 'desktop';
  ctaId: string;
  location: string;
  courseSlug?: string;
  branchKey?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export function buildWhatsAppClickPayload(params: {
  pathname: string | null;
  pageType?: PageType;
  ctaType: WhatsAppCtaType;
  phoneNumber: string;
  hadPrefill: boolean;
  /** Defaults to the ctaType. */
  ctaId?: string;
  location: string;
  courseSlug?: string;
  branchKey?: string;
}): WhatsAppClickPayload {
  const payload = {
    ...pageContext(params.pathname, params.pageType),
    ctaType: params.ctaType,
    phoneNumber: params.phoneNumber,
    hadPrefill: params.hadPrefill,
    ctaId: toTrackingId(params.ctaId ?? params.ctaType, 'untagged'),
    location: toTrackingId(params.location),
  } as WhatsAppClickPayload;
  if (params.courseSlug) payload.courseSlug = params.courseSlug;
  if (params.branchKey) payload.branchKey = params.branchKey;
  return payload;
}

export function logWhatsAppClick(payload: WhatsAppClickPayload): void {
  beacon('/api/whatsapp-clicks', payload);
}

export function logCallClick(params: {
  pathname: string | null;
  pageType?: PageType;
  phoneNumber: string;
  ctaId: string;
  location: string;
  courseSlug?: string;
  branchKey?: string;
}): void {
  const payload: Record<string, string> = {
    ...pageContext(params.pathname, params.pageType),
    phoneNumber: params.phoneNumber,
    ctaId: toTrackingId(params.ctaId, 'untagged'),
    location: toTrackingId(params.location),
  };
  if (params.courseSlug) payload.courseSlug = params.courseSlug;
  if (params.branchKey) payload.branchKey = params.branchKey;
  beacon('/api/call-clicks', payload);
}

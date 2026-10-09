/* -------------------------------------------------------------------------- */
/*  Attribution snapshots, stored in localStorage (course enrolment is a      */
/*  multi-day consideration cycle that outlives a tab):                       */
/*  - first touch: captured once per visitor (first write wins), so lead      */
/*    forms can report which campaign originally brought them in;            */
/*  - last touch: overwritten by every later visit that arrives from a        */
/*    campaign (UTM / gclid / fbclid) or from another site, so the lead also  */
/*    shows the visit that converted.                                         */
/*  Nothing here identifies a person: no IP, no cookies of other sites.       */
/* -------------------------------------------------------------------------- */

import { extractUtmParams } from '@/lib/click-tracking';

export const FIRST_TOUCH_STORAGE_KEY = 'coss_first_touch';
export const LAST_TOUCH_STORAGE_KEY = 'coss_last_touch';

/** Campaign parameters read from the landing URL. */
export interface CampaignParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
}

export interface FirstTouchSnapshot extends CampaignParams {
  referrer: string | null;
  landingPage: string;
  capturedAt: string;
}

export type LastTouchSnapshot = FirstTouchSnapshot;

/** utm_* plus Google / Meta click ids from a query string. */
export function campaignParamsFrom(search: string): CampaignParams {
  const p = new URLSearchParams(search);
  const out: CampaignParams = {};
  const set = (key: keyof CampaignParams, param: string) => {
    const v = p.get(param)?.trim();
    if (v) out[key] = v.slice(0, 500);
  };
  set('utmSource', 'utm_source');
  set('utmMedium', 'utm_medium');
  set('utmCampaign', 'utm_campaign');
  set('utmTerm', 'utm_term');
  set('utmContent', 'utm_content');
  set('gclid', 'gclid');
  set('fbclid', 'fbclid');
  return out;
}

/** A referrer from another site (not this one, not empty). */
export function isExternalReferrer(referrer: string | null | undefined, ownHost: string): boolean {
  if (!referrer) return false;
  try {
    return new URL(referrer).host !== ownHost;
  } catch {
    return false;
  }
}

function snapshotNow(): FirstTouchSnapshot {
  return {
    ...extractUtmParams(),
    ...campaignParamsFrom(window.location.search),
    referrer: document.referrer || null,
    landingPage: window.location.pathname,
    capturedAt: new Date().toISOString(),
  };
}

/**
 * Writes the first-touch snapshot if (and only if) one isn't already stored, and updates the
 * last-touch snapshot when this visit came from a campaign or another site. Fails soft: any
 * localStorage failure (private mode, quota, disabled) just means nothing is captured.
 */
export function captureFirstTouch(): void {
  try {
    const now = snapshotNow();
    if (!window.localStorage.getItem(FIRST_TOUCH_STORAGE_KEY)) {
      window.localStorage.setItem(FIRST_TOUCH_STORAGE_KEY, JSON.stringify(now));
    }
    const hasCampaign = Object.keys(campaignParamsFrom(window.location.search)).length > 0;
    if (hasCampaign || isExternalReferrer(now.referrer, window.location.host) || !window.localStorage.getItem(LAST_TOUCH_STORAGE_KEY)) {
      window.localStorage.setItem(LAST_TOUCH_STORAGE_KEY, JSON.stringify(now));
    }
  } catch {
    /* storage unavailable — a lead submission must never depend on this */
  }
}

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Reads the stored first-touch snapshot. Never throws: any storage failure
 * or malformed JSON returns null so callers can spread it in unconditionally.
 */
export function getFirstTouch(): FirstTouchSnapshot | null {
  return read<FirstTouchSnapshot>(FIRST_TOUCH_STORAGE_KEY);
}

export function getLastTouch(): LastTouchSnapshot | null {
  return read<LastTouchSnapshot>(LAST_TOUCH_STORAGE_KEY);
}

/** Attribution fields every lead form sends (the API keeps only what it stores). */
export interface AttributionFields extends CampaignParams {
  referrer?: string;
  landingPage?: string;
  lastUtmSource?: string;
  lastUtmMedium?: string;
  lastUtmCampaign?: string;
  lastUtmTerm?: string;
  lastUtmContent?: string;
  lastGclid?: string;
  lastFbclid?: string;
  lastReferrer?: string;
  lastLandingPage?: string;
  lastTouchAt?: string;
}

export function attributionFrom(first: FirstTouchSnapshot | null, last: LastTouchSnapshot | null): AttributionFields {
  return {
    utmSource: first?.utmSource,
    utmMedium: first?.utmMedium,
    utmCampaign: first?.utmCampaign,
    utmTerm: first?.utmTerm,
    utmContent: first?.utmContent,
    gclid: first?.gclid,
    fbclid: first?.fbclid,
    referrer: first?.referrer ?? undefined,
    landingPage: first?.landingPage,
    lastUtmSource: last?.utmSource,
    lastUtmMedium: last?.utmMedium,
    lastUtmCampaign: last?.utmCampaign,
    lastUtmTerm: last?.utmTerm,
    lastUtmContent: last?.utmContent,
    lastGclid: last?.gclid,
    lastFbclid: last?.fbclid,
    lastReferrer: last?.referrer ?? undefined,
    lastLandingPage: last?.landingPage,
    lastTouchAt: last?.capturedAt,
  };
}

/** First + last touch, ready to spread into a lead form's request body. */
export function getAttribution(): AttributionFields {
  return attributionFrom(getFirstTouch(), getLastTouch());
}

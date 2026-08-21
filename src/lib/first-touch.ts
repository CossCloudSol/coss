/* -------------------------------------------------------------------------- */
/*  First-touch attribution snapshot. Captured once per visitor (first write  */
/*  wins) so lead forms can report which campaign originally brought them in, */
/*  even days later. Storage is localStorage, not sessionStorage, since       */
/*  course enrolment is a multi-day consideration cycle that outlives a tab.  */
/* -------------------------------------------------------------------------- */

import { extractUtmParams } from '@/lib/click-tracking';

export const FIRST_TOUCH_STORAGE_KEY = 'coss_first_touch';

export interface FirstTouchSnapshot {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer: string | null;
  landingPage: string;
  capturedAt: string;
}

/**
 * Writes the first-touch snapshot if (and only if) one isn't already stored.
 * Fails soft: any localStorage failure (private mode, quota, disabled) is
 * swallowed and simply results in no snapshot being captured.
 */
export function captureFirstTouch(): void {
  try {
    if (window.localStorage.getItem(FIRST_TOUCH_STORAGE_KEY)) return;

    const snapshot: FirstTouchSnapshot = {
      ...extractUtmParams(),
      referrer: document.referrer || null,
      landingPage: window.location.pathname,
      capturedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(FIRST_TOUCH_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* storage unavailable — a lead submission must never depend on this */
  }
}

/**
 * Reads the stored first-touch snapshot. Never throws: any storage failure
 * or malformed JSON returns null so callers can spread it in unconditionally.
 */
export function getFirstTouch(): FirstTouchSnapshot | null {
  try {
    const raw = window.localStorage.getItem(FIRST_TOUCH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FirstTouchSnapshot;
  } catch {
    return null;
  }
}

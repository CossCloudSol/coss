/**
 * Server side of lead attribution and consent (item 5). The lead APIs pass the raw request
 * body here; only known keys are kept. Attribution is best-effort tracking data, so a bad
 * value is dropped (stored as null) instead of rejecting the enquiry. Times come from the
 * server clock, except lastTouchAt (when the visitor arrived), which is accepted only as a
 * sane recent date. No IP address or other identifier is stored.
 * Dependency-free (unit-tested in scripts/test/attribution.test.mjs).
 */

const TEXT_MAX = 500;
const URLISH_MAX = 2048;
const MAX_TOUCH_AGE_MS = 400 * 24 * 60 * 60 * 1000; // older snapshots are not plausible
const MAX_CLOCK_SKEW_MS = 10 * 60 * 1000;

function text(v: unknown, max = TEXT_MAX): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t.slice(0, max);
}

function touchTime(v: unknown, now: Date): Date | null {
  if (typeof v !== 'string') return null;
  const d = new Date(v);
  const t = d.getTime();
  if (Number.isNaN(t)) return null;
  if (t > now.getTime() + MAX_CLOCK_SKEW_MS || t < now.getTime() - MAX_TOUCH_AGE_MS) return null;
  return d;
}

/** First-touch fields (Lead and CorporateLead). */
export function firstTouchData(body: unknown) {
  const b = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;
  return {
    utmSource: text(b.utmSource),
    utmMedium: text(b.utmMedium),
    utmCampaign: text(b.utmCampaign),
    utmTerm: text(b.utmTerm),
    utmContent: text(b.utmContent),
    gclid: text(b.gclid),
    fbclid: text(b.fbclid),
    referrer: text(b.referrer, URLISH_MAX),
    landingPage: text(b.landingPage, URLISH_MAX),
  };
}

/** Last-touch fields (Lead only). */
export function lastTouchData(body: unknown, now: Date = new Date()) {
  const b = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;
  return {
    lastUtmSource: text(b.lastUtmSource),
    lastUtmMedium: text(b.lastUtmMedium),
    lastUtmCampaign: text(b.lastUtmCampaign),
    lastUtmTerm: text(b.lastUtmTerm),
    lastUtmContent: text(b.lastUtmContent),
    lastGclid: text(b.lastGclid),
    lastFbclid: text(b.lastFbclid),
    lastReferrer: text(b.lastReferrer, URLISH_MAX),
    lastLandingPage: text(b.lastLandingPage, URLISH_MAX),
    lastTouchAt: touchTime(b.lastTouchAt, now),
  };
}

/**
 * Consent and the optional WhatsApp opt-in. consentAt is the moment the form was submitted
 * (every lead form shows the privacy notice next to its submit button). The opt-in counts only
 * when the box was ticked (whatsappOptIn === true); its time is stored only then.
 */
export function consentData(body: unknown, now: Date = new Date()) {
  const b = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;
  const optIn = b.whatsappOptIn === true;
  return {
    consentAt: now,
    whatsappOptIn: optIn,
    whatsappOptInAt: optIn ? now : null,
  };
}

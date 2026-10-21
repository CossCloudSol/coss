/**
 * Shared rules for the public enquiry forms (contact, course enquiry,
 * corporate). Imported by both the form components and the API routes so the
 * browser and the server accept exactly the same input. No server-only
 * imports here. The browser forms import src/lib/lead-checks.ts instead (no zod).
 */

import { z } from 'zod';
import { COMPANY_NAME_ERROR, COMPANY_NAME_RE, FILL_TIME_FIELD, HONEYPOT_FIELD, LEGACY_HONEYPOT_FIELD, NAME_ERROR, PERSON_NAME_RE, PHONE_ERROR, normalizeCompanyName, normalizeIndianMobile, normalizeName } from '@/lib/lead-checks';

export { COMPANY_NAME_ERROR, COMPANY_NAME_RE, FILL_TIME_FIELD, HONEYPOT_FIELD, LEGACY_HONEYPOT_FIELD, MIN_FILL_MS, MIN_FILL_MS_POPUP, NAME_ERROR, PERSON_NAME_RE, PHONE_ERROR, isValidCompanyName, isValidName, normalizeCompanyName, normalizeIndianMobile, normalizeName } from '@/lib/lead-checks';

/* -------------------------------------------------------------------------- */
/*  Phone                                                                     */
/* -------------------------------------------------------------------------- */

/** Validates without transforming (the routes add .transform() to normalise). */
export const phoneField = z
  .string()
  .trim()
  .refine((v) => normalizeIndianMobile(v) !== null, PHONE_ERROR);

/* -------------------------------------------------------------------------- */
/*  Name                                                                      */
/* -------------------------------------------------------------------------- */

// normalizeName first (dash look-alikes -> "-", spaces collapsed, trimmed), then the same rule as the browser.
export const nameField = z.string().transform(normalizeName).pipe(z.string().regex(PERSON_NAME_RE, NAME_ERROR));

// Corporate form's company name: same cleaning, a wider character set (digits, & . , ( ) / +), 2-100 characters.
export const companyNameField = z.string().transform(normalizeCompanyName).pipe(z.string().regex(COMPANY_NAME_RE, COMPANY_NAME_ERROR));

/* -------------------------------------------------------------------------- */
/*  Source button (intent-tracking's last click, under 30 minutes old)        */
/* -------------------------------------------------------------------------- */

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const trackingId = z.preprocess(emptyToUndefined, z.string().trim().regex(/^[a-z0-9_]{1,60}$/).optional());

/**
 * sourceCta / sourceLocation / sourcePath on a lead body. Optional and best-effort: a value
 * that doesn't fit is dropped (never a 422), since the visitor can't fix it.
 */
export function leadSourceData(body: unknown): { sourceCta: string | null; sourceLocation: string | null; sourcePath: string | null } {
  const b = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const pick = <T>(schema: z.ZodType<T>, v: unknown): T | undefined => {
    const r = schema.safeParse(v);
    return r.success ? r.data : undefined;
  };
  return {
    sourceCta: pick(trackingId, b.sourceCta) ?? null,
    sourceLocation: pick(trackingId, b.sourceLocation) ?? null,
    sourcePath: pick(z.preprocess(emptyToUndefined, z.string().trim().max(300).regex(/^\/[a-zA-Z0-9\-_/]*$/).optional()), b.sourcePath) ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/*  Bot protection                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Until this moment a submission with no fill time is accepted (and logged),
 * not dropped: pages opened before this code shipped post without one.
 * 2026-09-29 00:00 IST. After it, a missing fill time counts as a bot with no
 * further deploy. Safe to delete the grace branch in botCheck once passed.
 */
export const MISSING_FILL_TIME_ACCEPTED_UNTIL = Date.parse('2026-09-29T00:00:00+05:30');

/**
 * The honeypot was renamed from "website" to "hp_extra" (autofill filled "website" for real
 * people). Pages opened before the rename still post the old name, so until this moment a
 * value in either field counts. 2026-10-29 00:00 IST, 7 days after the rename ships. After
 * it only hp_extra is checked, with no further deploy. Safe to delete the legacy check once
 * passed.
 */
export const LEGACY_HONEYPOT_ACCEPTED_UNTIL = Date.parse('2026-10-29T00:00:00+05:30');

function filled(value: unknown): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

export type BotCheck =
  | { verdict: 'human' }
  /** No fill time, accepted during the grace period. The caller logs it. */
  | { verdict: 'human_missing_fill_time' }
  | { verdict: 'bot'; reason: 'honeypot' | 'too_fast' | 'missing_fill_time' };

/**
 * Classifies a raw request body before validation. `minFillMs` is chosen by
 * the server from the form type, never taken from the request. A missing
 * fill time means the API was called directly (every form sends one), except
 * during the grace period above.
 */
export function botCheck(body: unknown, minFillMs: number, now: number = Date.now()): BotCheck {
  if (typeof body !== 'object' || body === null) return { verdict: 'human' };
  const fields = body as Record<string, unknown>;
  if (filled(fields[HONEYPOT_FIELD])) return { verdict: 'bot', reason: 'honeypot' };
  if (now < LEGACY_HONEYPOT_ACCEPTED_UNTIL && filled(fields[LEGACY_HONEYPOT_FIELD])) return { verdict: 'bot', reason: 'honeypot' };
  const fillMs = fields[FILL_TIME_FIELD];
  if (fillMs === undefined) {
    return now < MISSING_FILL_TIME_ACCEPTED_UNTIL
      ? { verdict: 'human_missing_fill_time' }
      : { verdict: 'bot', reason: 'missing_fill_time' };
  }
  if (typeof fillMs !== 'number' || !Number.isFinite(fillMs) || fillMs < minFillMs) {
    return { verdict: 'bot', reason: 'too_fast' };
  }
  return { verdict: 'human' };
}

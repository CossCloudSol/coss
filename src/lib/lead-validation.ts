/**
 * Shared rules for the public enquiry forms (contact, course enquiry,
 * corporate). Imported by both the form components and the API routes so the
 * browser and the server accept exactly the same input. No server-only
 * imports here. The browser forms import src/lib/lead-checks.ts instead (no zod).
 */

import { z } from 'zod';
import { FILL_TIME_FIELD, HONEYPOT_FIELD, NAME_ERROR, PERSON_NAME_RE, PHONE_ERROR, normalizeIndianMobile } from '@/lib/lead-checks';

export { FILL_TIME_FIELD, HONEYPOT_FIELD, MIN_FILL_MS, MIN_FILL_MS_POPUP, NAME_ERROR, PERSON_NAME_RE, PHONE_ERROR, isValidName, normalizeIndianMobile } from '@/lib/lead-checks';

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

export const nameField = z.string().trim().regex(PERSON_NAME_RE, NAME_ERROR);

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
  const honeypot = fields[HONEYPOT_FIELD];
  if (typeof honeypot === 'string' && honeypot.trim() !== '') return { verdict: 'bot', reason: 'honeypot' };
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

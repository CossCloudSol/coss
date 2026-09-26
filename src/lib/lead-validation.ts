/**
 * Shared rules for the public enquiry forms (contact, course enquiry,
 * corporate). Imported by both the form components and the API routes so the
 * browser and the server accept exactly the same input. No server-only
 * imports here: this file ships to the client.
 */

import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/*  Phone                                                                     */
/* -------------------------------------------------------------------------- */

// 10 digits starting 6-9, optionally prefixed with +91 or 0. Spaces and
// hyphens are ignored so "+91 98765-43210" is accepted.
const INDIAN_MOBILE_RE = /^(?:\+91|0)?([6-9]\d{9})$/;

export const PHONE_ERROR = 'Enter a valid Indian mobile number (10 digits starting with 6-9)';

/** Canonical "+91XXXXXXXXXX" for a valid Indian mobile, otherwise null. */
export function normalizeIndianMobile(raw: string): string | null {
  const match = raw.replace(/[\s-]/g, '').match(INDIAN_MOBILE_RE);
  return match ? `+91${match[1]}` : null;
}

/** Validates without transforming, so react-hook-form input and output types stay string. */
export const phoneField = z
  .string()
  .trim()
  .refine((v) => normalizeIndianMobile(v) !== null, PHONE_ERROR);

/* -------------------------------------------------------------------------- */
/*  Name                                                                      */
/* -------------------------------------------------------------------------- */

// 2-60 characters: letters in any script (\p{M} keeps combining marks,
// needed for Indic scripts), spaces, and . ' - for initials and names like
// "K. Ramesh", "O'Brien", "Anne-Marie". ’ is the apostrophe iOS types by
// default. The lookahead requires at least one letter, so "..." fails.
const PERSON_NAME_RE = /^(?=.*\p{L})[\p{L}\p{M} .'’-]{2,60}$/u;

export const NAME_ERROR = "Name must be 2-60 characters: letters, spaces, . ' or -";

export const nameField = z.string().trim().regex(PERSON_NAME_RE, NAME_ERROR);

/* -------------------------------------------------------------------------- */
/*  Bot protection                                                            */
/* -------------------------------------------------------------------------- */

/** Hidden input real visitors never see; any value means a bot filled it. */
export const HONEYPOT_FIELD = 'website';
/** Milliseconds between the form appearing and being submitted. */
export const FILL_TIME_FIELD = 'fillMs';
/** Page forms submitted faster than this are treated as bots. */
export const MIN_FILL_MS = 3000;
/** Shorter minimum for the WhatsApp widget and brochure popup (name + phone only). */
export const MIN_FILL_MS_POPUP = 1500;

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

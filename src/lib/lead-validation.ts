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

// Letters in any script (\p{M} keeps combining marks, needed for Indic
// scripts) and spaces only.
const PERSON_NAME_RE = /^[\p{L}\p{M} ]{2,60}$/u;

export const NAME_ERROR = 'Name must be 2-60 letters and spaces';

export const nameField = z.string().trim().regex(PERSON_NAME_RE, NAME_ERROR);

/* -------------------------------------------------------------------------- */
/*  Bot protection                                                            */
/* -------------------------------------------------------------------------- */

/** Hidden input real visitors never see; any value means a bot filled it. */
export const HONEYPOT_FIELD = 'website';
/** Milliseconds between the form appearing and being submitted. */
export const FILL_TIME_FIELD = 'fillMs';
/** Submissions faster than this are treated as bots. */
export const MIN_FILL_MS = 3000;

/**
 * Why a submission looks automated, or null when it looks human. A missing
 * fill time counts as a bot: every form sends one, so its absence means the
 * API was called directly.
 */
export function botReason(body: unknown): 'honeypot' | 'too_fast' | null {
  if (typeof body !== 'object' || body === null) return null;
  const fields = body as Record<string, unknown>;
  const honeypot = fields[HONEYPOT_FIELD];
  if (typeof honeypot === 'string' && honeypot.trim() !== '') return 'honeypot';
  const fillMs = fields[FILL_TIME_FIELD];
  if (typeof fillMs !== 'number' || !Number.isFinite(fillMs) || fillMs < MIN_FILL_MS) return 'too_fast';
  return null;
}

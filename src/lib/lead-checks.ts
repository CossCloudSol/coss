// The public enquiry forms' input rules, without zod: the browser bundles this file
// (every lead form imports it), so it stays dependency-free. The API routes use the
// same rules through the zod schemas in src/lib/lead-validation.ts.

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

/* -------------------------------------------------------------------------- */
/*  Name                                                                      */
/* -------------------------------------------------------------------------- */

// 2-60 characters: letters in any script (\p{M} keeps combining marks,
// needed for Indic scripts), spaces, and . ' - for initials and names like
// "K. Ramesh", "O'Brien", "Anne-Marie". ’ is the apostrophe iOS types by
// default. The lookahead requires at least one letter, so "..." fails.
export const PERSON_NAME_RE = /^(?=.*\p{L})[\p{L}\p{M} .'’-]{2,60}$/u;

export const NAME_ERROR = "Name must be 2-60 characters: letters, spaces, . ' or -";

/** True for a name the API accepts (same rule as nameField). */
export function isValidName(raw: string): boolean {
  return PERSON_NAME_RE.test(raw.trim());
}

/* -------------------------------------------------------------------------- */
/*  Bot protection fields                                                     */
/* -------------------------------------------------------------------------- */

/** Hidden input real visitors never see; any value means a bot filled it. */
export const HONEYPOT_FIELD = 'website';
/** Milliseconds between the form appearing and being submitted. */
export const FILL_TIME_FIELD = 'fillMs';
/** Page forms submitted faster than this are treated as bots. */
export const MIN_FILL_MS = 3000;
/** Shorter minimum for the WhatsApp widget and brochure popup (name + phone only). */
export const MIN_FILL_MS_POPUP = 1500;

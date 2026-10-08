// Field rules for the browser lead forms, without zod or react-hook-form (item 14: lighter
// form pages). Same rules and messages the API routes enforce with zod
// (src/lib/lead-validation.ts). Dependency-free (unit-tested in
// scripts/test/lead-form-rules.test.mjs).
import { NAME_ERROR, PHONE_ERROR, isValidName, normalizeIndianMobile } from '@/lib/lead-checks';

/** Returns the error message, or null when the value is fine. */
export type Rule = (value: string) => string | null;

// Same practical shape zod's .email() accepts: something@something.tld, no spaces.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const rules = {
  name: (): Rule => (v) => (isValidName(v) ? null : NAME_ERROR),
  phone: (): Rule => (v) => (normalizeIndianMobile(v.trim()) ? null : PHONE_ERROR),
  oneOf: (options: readonly string[], message: string): Rule => (v) => (options.includes(v) ? null : message),
  minLength: (n: number, message: string): Rule => (v) => (v.length >= n ? null : message),
  maxLength: (n: number, message: string): Rule => (v) => (v.length <= n ? null : message),
  email: (message: string): Rule => (v) => (EMAIL_RE.test(v) ? null : message),
};

/** Fields whose submitted value is trimmed (as zod's .trim() did for these). */
const TRIMMED = new Set(['name', 'phone', 'contactPerson']);

export type LeadSchema<V extends Record<string, string>> = { [K in keyof V]: Rule[] };

/**
 * Checks the submitted values against the schema: the first failing rule per field gives
 * its message. Missing fields count as ''. Only the schema's fields are returned.
 */
export function validateLead<V extends Record<string, string>>(
  schema: LeadSchema<V>,
  raw: Record<string, unknown>,
): { values: V; errors: Partial<Record<keyof V, string>> } {
  const values = {} as Record<string, string>;
  const errors: Partial<Record<keyof V, string>> = {};
  for (const key of Object.keys(schema) as Array<keyof V & string>) {
    const given = typeof raw[key] === 'string' ? (raw[key] as string) : '';
    const value = TRIMMED.has(key) ? given.trim() : given;
    values[key] = value;
    for (const rule of schema[key]) {
      const message = rule(value);
      if (message) {
        errors[key] = message;
        break;
      }
    }
  }
  return { values: values as V, errors };
}

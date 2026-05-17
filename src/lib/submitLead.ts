/**
 * Tiny client-side helper for the public lead-capture endpoint. All three
 * public forms (hero, full, demo) post through this so phone normalization,
 * empty-string-as-undefined coercion, and error extraction live in one place.
 */

export type Branch = 'Dilsukhnagar' | 'Ameerpet' | 'Online';
export type FormType = 'hero' | 'full' | 'demo' | 'whatsapp_widget';

export interface LeadSubmitInput {
  name: string;
  phone: string;
  email?: string;
  course?: string;
  inquiryType?: string;
  branch: Branch;
  message?: string;
  formType: FormType;
}

export type LeadSubmitResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

/* -------------------------------------------------------------------------- */
/*  Submit                                                                    */
/* -------------------------------------------------------------------------- */

export async function submitLead(
  input: LeadSubmitInput,
): Promise<LeadSubmitResult> {
  const phone = canonicalisePhone(input.phone);

  const body = {
    name: input.name,
    phone,
    email: emptyToUndefined(input.email),
    course: emptyToUndefined(input.course),
    inquiryType: emptyToUndefined(input.inquiryType),
    branch: input.branch,
    message: emptyToUndefined(input.message),
    formType: input.formType,
  };

  let res: Response;
  try {
    res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      message: 'Network error. Please check your connection and try again.',
    };
  }

  if (res.ok) {
    let id = '';
    try {
      const data: unknown = await res.json();
      if (data !== null && typeof data === 'object') {
        const idValue = (data as Record<string, unknown>).id;
        if (typeof idValue === 'string') id = idValue;
      }
    } catch {
      /* missing / unparsable body — still treat as success */
    }
    return { ok: true, id };
  }

  return { ok: false, message: await extractErrorMessage(res) };
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Strip non-digits then prefix `+91`. Idempotent: if the input already has a
 * leading `91` after stripping, we don't double-prefix.
 */
function canonicalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const tenDigit =
    digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return `+91${tenDigit}`;
}

function emptyToUndefined(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const data: unknown = await res.json();
    if (data !== null && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (typeof obj.error === 'string') return obj.error;
      if (typeof obj.message === 'string') return obj.message;
      const errors = obj.errors;
      if (errors !== null && typeof errors === 'object' && errors !== undefined) {
        for (const messages of Object.values(errors as Record<string, unknown>)) {
          if (Array.isArray(messages) && typeof messages[0] === 'string') {
            return messages[0];
          }
        }
      }
    }
  } catch {
    /* fall through */
  }
  return 'Something went wrong. Please try again.';
}

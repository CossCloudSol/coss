// Every lead form lands on /thank-you after a successful submit, with the form
// type in the query (?form=…) so GA4 page views can be split by form. The
// generate_lead event fires before this (submitLead / trackLeadEvent).
// Dependency-free (unit-tested in scripts/test/lead-thank-you.test.mjs).

export const THANK_YOU_PATH = '/thank-you'

const FORM_TYPE_RE = /^[a-z_]{1,32}$/

export function thankYouPath(formType: string): string {
  return FORM_TYPE_RE.test(formType) ? `${THANK_YOU_PATH}?form=${formType}` : THANK_YOU_PATH
}

/** Reads ?form= back on the page; anything unexpected becomes undefined. */
export function parseThankYouForm(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value
  return v && FORM_TYPE_RE.test(v) ? v : undefined
}

/** Client only: called right after a successful submit. */
export function goToThankYou(formType: string): void {
  if (typeof window === 'undefined') return
  window.location.assign(thankYouPath(formType))
}

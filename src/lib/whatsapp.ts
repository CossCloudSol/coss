// The ONLY place '918885166007' appears as a literal in application code.
// Every WhatsApp CTA resolves its number through this export (directly, or
// via <WhatsAppLink>'s default) instead of hardcoding its own copy.
export const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '918885166007'

export function batchBookingMessage(params: {
  courseName: string
  mode: string
  startDate: string
  centre?: string | null
  schedule: string
}): string {
  if (params.mode === 'Online') {
    return `Hi Coss Cloud Solutions Team,\n\nI want to enroll in the online ${params.courseName} batch.\n\nBatch details:\n- Start date: ${params.startDate}\n- Schedule: ${params.schedule}\n- Mode: Online\n\nPlease share enrollment details. Thank you!`
  }
  return `Hi Coss Cloud Solutions Team,\n\nI want to book a seat for the ${params.courseName} batch.\n\nBatch details:\n- Start date: ${params.startDate}\n- Centre: ${params.centre || 'Coss Cloud Solutions'}\n- Schedule: ${params.schedule}\n- Mode: ${params.mode}\n\nPlease confirm my seat. Thank you!`
}

export function jobApplyMessage(params: {
  jobTitle: string
  company: string
}): string {
  return `Hi Coss Cloud Solutions Team,\n\nI'm interested in the ${params.jobTitle} position at ${params.company}.\n\nI found this job on your website and would like to know more about applying through Coss Cloud Solutions placement assistance.\n\nPlease guide me on next steps. Thank you!`
}

export type BrochureDeliveryResult =
  | { ok: true; waLink: string; normalizedPhone: string }
  | { ok: false; error: string }

// Single isolation point for brochure delivery. Today it validates/normalizes
// the visitor's number and returns a wa.me link (always addressed to
// WA_NUMBER — the visitor opens WhatsApp on their own phone and sends it
// themselves; a staff member replies with the actual PDF). The message is a
// fixed template with one variable slot, not free-form text, so it can be
// submitted as a real WhatsApp template later. A future WhatsApp Business API
// implementation replaces only this function's internals — every caller
// keeps working unchanged.
export function buildBrochureDelivery(phone: string, courseName: string): BrochureDeliveryResult {
  const digits = phone.replace(/\D/g, '')
  const tenDigit = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits
  if (!/^[6-9]\d{9}$/.test(tenDigit)) {
    return { ok: false, error: 'Enter a valid 10-digit Indian mobile number' }
  }
  const normalizedPhone = `+91${tenDigit}`
  const message = `Hi, please send me the syllabus for ${courseName}`
  return {
    ok: true,
    waLink: `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`,
    normalizedPhone,
  }
}

import { normalizeIndianMobile, PHONE_ERROR } from '@/lib/lead-checks'
import { PRIMARY_PHONE } from '@/lib/nap'
import { buildWaText } from '@/lib/wa-ref'

// WhatsApp defaults to the main number (src/lib/nap.ts), digits only.
// Every WhatsApp CTA resolves its number through this export (directly, or
// via <WhatsAppLink>'s default) instead of hardcoding its own copy.
export const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? PRIMARY_PHONE.replace(/D/g, '')

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
  const normalizedPhone = normalizeIndianMobile(phone)
  if (normalizedPhone === null) {
    return { ok: false, error: PHONE_ERROR }
  }
  // Same standard text as every WhatsApp link (course + ref code); the real channel is put in at click time.
  const message = buildWaText({ courseName, channel: 'D' })
  return {
    ok: true,
    waLink: `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`,
    normalizedPhone,
  }
}

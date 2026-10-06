// The one source for the business name, the main phone number and the contact
// email used across the site (header, footer, sidebars, policies, schema).
// Per-centre details (address, centre phone, hours) live in BranchSettings and
// come from src/lib/get-branch-settings.ts. The WhatsApp number is WA_NUMBER in
// src/lib/whatsapp.ts. Dependency-free (unit-tested in scripts/test/nap.test.mjs).

/** Brand spelling everywhere text is shown. The logo wordmark is an image and stays as it is. */
export const BRAND_NAME = 'Coss Cloud Solutions'

/** Main enquiry line, E.164: the tel: href and the value click tracking logs. */
export const PRIMARY_PHONE = '+918885166007'

/** The same number as it is written on the page. */
export const PRIMARY_PHONE_LABEL = '+91 88851 66007'

export const CONTACT_EMAIL = 'info@cosscloudsol.com'

/** Registered office, as written in the policies. */
export const REGISTERED_ADDRESS =
  'Flat No. 109, Eastern Home, C.B, Srinagar Colony, Kamala Nagar, Dilsukhnagar, Hyderabad, Telangana 500060'

/** "+91 88851 66007" style label for any Indian mobile in any spacing; other input is returned trimmed. */
export function formatIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  const ten = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits
  return /^[6-9]\d{9}$/.test(ten) ? `+91 ${ten.slice(0, 5)} ${ten.slice(5)}` : raw.trim()
}

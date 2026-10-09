import type { Metadata } from 'next'
import Link from 'next/link'
import { PageBanner, ResponsivePageStyles } from '@/components/shared'
import { parseThankYouForm } from '@/lib/lead-thank-you'

export const metadata: Metadata = {
  title: 'Thank You | Coss Cloud Solutions',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: { form?: string | string[] }
}

const MESSAGES: Record<string, string> = {
  corporate: 'Our team will contact you within 24 hours with a customised training proposal.',
  brochure_request: 'The brochure request has opened in WhatsApp. Our team will also call you shortly.',
  whatsapp_widget: 'Your chat has opened in WhatsApp. Our team will reply there shortly.',
}
const DEFAULT_MESSAGE = 'We have received your details. Our team will contact you shortly on call or WhatsApp.'

const linkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '44px',
  padding: '0 22px',
  borderRadius: '8px',
  fontFamily: 'var(--font-poppins), Poppins, sans-serif',
  fontWeight: 700,
  fontSize: '14px',
  textDecoration: 'none',
} as const

export default function ThankYouPage({ searchParams }: Props) {
  const form = parseThankYouForm(searchParams.form)
  const message = (form && MESSAGES[form]) || DEFAULT_MESSAGE
  return (
    <>
      <ResponsivePageStyles />
      <PageBanner title="Thank You" />
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '56px 20px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-poppins), Poppins, sans-serif', fontWeight: 700, fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>
          Thanks, your enquiry has been sent.
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.7, marginBottom: '28px' }}>{message}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          <Link href="/courses" style={{ ...linkStyle, background: '#e8401c', color: '#fff' }}>
            Browse Courses
          </Link>
          <Link href="/" style={{ ...linkStyle, border: '1.5px solid #024c57', color: '#024c57' }}>
            Back to Home
          </Link>
        </div>
      </div>
    </>
  )
}

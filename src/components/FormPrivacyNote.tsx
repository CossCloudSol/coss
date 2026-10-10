import Link from 'next/link'

/**
 * One-line notice under every lead form's submit button. Takes the form's own text colour.
 * The link's padding/negative margin gives it a 44px tap area without changing the line height.
 */
export default function FormPrivacyNote() {
  return (
    // No inline colour or opacity: the text takes the surface's colour (inherited), and
    // `.light-surface .form-privacy-note` in globals.css pins it on a white card.
    <p className="form-privacy-note" style={{ margin: '8px 0 0', fontSize: '11.5px', lineHeight: 1.5, textAlign: 'center' }}>
      We use your details only to contact you about courses. See our{' '}
      <Link href="/privacy-policy" style={{ textDecoration: 'underline', display: 'inline-block', padding: '15px 0', margin: '-15px 0' }}>
        Privacy Policy
      </Link>
      .
    </p>
  )
}

import Link from 'next/link'
import { MapPin } from 'lucide-react'
import FooterLogo from './FooterLogo'
import FooterNavCol from './FooterNavCol'
import CallLink from './CallLink'
import WhatsAppLink from './WhatsAppLink'
import { getBranchSettings, FALLBACK, type BranchSettings } from '@/lib/get-branch-settings'

const CATEGORIES = [
  { label: 'Data, Analytics & BI',               href: '/courses/data-analytics-bi/' },
  { label: 'Cloud Computing',                    href: '/courses/cloud-computing/' },
  { label: 'DevOps & Multi-Cloud',               href: '/courses/devops-multi-cloud/' },
  { label: 'Programming & Full Stack Development', href: '/courses/programming-full-stack/' },
  { label: 'Data Engineering',                   href: '/courses/data-engineering/' },
  { label: 'Cyber Security & Networking',        href: '/courses/cyber-security/' },
  { label: 'ERP, CRM & Enterprise Tools',        href: '/courses/erp-crm-enterprise-tools/' },
  { label: 'Software Testing & OS',              href: '/courses/software-testing-os/' },
  { label: 'Digital & Design',                   href: '/courses/digital-design/' },
  { label: 'Professional & Soft Skills',         href: '/courses/professional-soft-skills/' },
  { label: 'Human Resource',                     href: '/courses/human-resource/' },
  { label: 'Quantum Computing',                  href: '/courses/quantum-computing/' },
]

const COMPANY = [
  { label: 'About Us',          href: '/about-us/' },
  { label: 'Why Us',            href: '/why-us/' },
  { label: 'Corporate Training', href: '/corporate-training/' },
  { label: 'Placements',        href: '/placements/' },
  { label: 'Student Reviews',   href: '/student-reviews/' },
  { label: 'Contact Us',        href: '/contact-us/' },
]

const RESOURCES = [
  { label: 'Job Openings',      href: '/jobs/' },
  { label: 'Upcoming Batches',  href: '/batches/' },
  { label: 'Blog',              href: '/blog/' },
]

// Branch cards render from BranchSettings (DB), the same table the admin
// GEO & Local SEO Manager (/admin/geo) edits — this list is just presentation
// order/slug, not branch data. See buildBranchCard() below.
const BRANCH_KEYS = [
  { branchKey: 'dilsukhnagar', slug: 'dilsukhnagar' },
  { branchKey: 'ameerpet', slug: 'ameerpet' },
] as const

function buildBranchCard(branchKey: string, slug: string, branch: BranchSettings) {
  const hasCoords = !!(branch.latitude && branch.longitude)
  if (!hasCoords) {
    console.log(`[Footer] BranchSettings "${branchKey}" has no usable coordinates, falling back to known-correct NAP constants`)
  }
  const fallback = FALLBACK[branchKey] ?? FALLBACK.dilsukhnagar
  const lat = hasCoords ? branch.latitude : fallback.latitude
  const lng = hasCoords ? branch.longitude : fallback.longitude

  const addressParts = [branch.addressLine1, branch.addressLine2].filter(Boolean)

  return {
    name: branch.branchName.replace(/^Coss Cloud Solutions\s*—\s*/, ''),
    slug,
    subtitle: `${addressParts.join(', ')}, ${branch.city} – ${branch.pincode}`,
    directionsHref: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
  }
}

const CATCHMENT_AREAS = [
  { label: 'Kukatpally',            href: '/locations/kukatpally/' },
  { label: 'Madhapur & HITEC City', href: '/locations/madhapur-hitec-city/' },
]

const SOCIALS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/CossCloudSolutions/',
    bg: '#1877F2',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/cosscloudsolutionshyd/',
    bg: '#E1306C',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@cossdsnr-b5e',
    bg: '#FF0000',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58a2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/coss-cloud-solutions',
    bg: '#0A66C2',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect x="2" y="9" width="4" height="12"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
  {
    label: 'X (Twitter)',
    href: 'https://x.com/DsnrCoss',
    bg: '#000000',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
]

export default async function Footer() {
  const year = new Date().getFullYear()

  // getBranchSettings() is wrapped in unstable_cache (tag 'branch-settings',
  // revalidate: 86400 — 24h), unlike SeoSettings' 5-min in-memory TTL. Root
  // layout.tsx sets `export const dynamic = 'force-dynamic'`, but that only
  // forces this Server Component to re-render per request — it does not
  // bypass unstable_cache. Admin edits in /admin/geo only show up here once
  // the 24h tag expires, or immediately if that save path calls
  // revalidateTag('branch-settings').
  const branchRows = await Promise.all(BRANCH_KEYS.map(b => getBranchSettings(b.branchKey)))
  const BRANCHES = BRANCH_KEYS.map((b, i) => buildBranchCard(b.branchKey, b.slug, branchRows[i]))

  return (
    <footer className="site-footer">

      {/* ── Single responsive footer grid ── */}
      <div className="footer-grid">

        {/* Col 1 — Brand */}
        <div className="footer-col">
          <FooterLogo />
          <p className="footer-desc">
            Leading IT training institute in Hyderabad with expert trainers, practical labs, and 50+ hiring partners since 2010.
          </p>

          {/* Desktop: full contact links (hidden on mobile via CSS) */}
          <div className="footer-clinks">
            <CallLink number="+918885166007" className="footer-clink">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              +91 88851 66007
            </CallLink>
            <a href="mailto:info@cosscloudsol.com" className="footer-clink">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              info@cosscloudsol.com
            </a>
          </div>

          {/* Mobile: compact quick-action buttons (hidden on desktop via CSS) */}
          <div className="footer-mquick">
            <CallLink number="+918885166007" className="footer-maction">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Call
            </CallLink>
            <a href="mailto:info@cosscloudsol.com" className="footer-maction">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              Email
            </a>
            <WhatsAppLink
              ctaType="footer"
              message="Hi Coss Cloud Solutions Team, I'd like to know about your courses and batch timings. Could you help me?"
              className="footer-maction"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
              WhatsApp
            </WhatsAppLink>
          </div>

          <div className="footer-socials">
            {SOCIALS.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                className="footer-social-icon" style={{ background: s.bg }}
                aria-label={s.label}>
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Col 2 — Courses: accordion on mobile, plain column on desktop */}
        <FooterNavCol title="Courses" links={CATEGORIES} />

        {/* Col 3 — Company */}
        <FooterNavCol title="Company" links={COMPANY} />

        {/* Col 4 — Resources */}
        <FooterNavCol title="Resources" links={RESOURCES} />

        {/* Col 5 — Our Branches */}
        <div className="footer-col footer-col-branches">
          <h4 className="footer-heading">Our Branches</h4>
          <div className="footer-branches-flex">
            {BRANCHES.map(b => (
              <div key={b.name} className="footer-branch-card">
                <div className="footer-branch-icon" aria-hidden="true">
                  <MapPin size={20} />
                </div>
                <div className="footer-branch-info">
                  <Link href={`/locations/${b.slug}/`} className="footer-branch-name">{b.name}</Link>
                  <p className="footer-branch-address">{b.subtitle}</p>
                </div>
                <a href={b.directionsHref} target="_blank" rel="noopener noreferrer" className="footer-branch-dir">
                  Directions <span aria-hidden="true">→</span>
                </a>
              </div>
            ))}
          </div>
          <p className="footer-areas-served">
            Also training students &amp; professionals from{' '}
            {CATCHMENT_AREAS.map((a, i) => (
              <span key={a.href}>
                {i > 0 && ' · '}
                <Link href={a.href}>{a.label}</Link>
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="footer-bottom">
        <div className="footer-btm-inner">
          <span>© {year} Coss Cloud Solutions. All rights reserved.</span>
          <div className="footer-btm-links">
            <Link href="/privacy-policy/">Privacy Policy</Link>
            <Link href="/terms-conditions/">Terms</Link>
            <Link href="/sitemap.xml">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

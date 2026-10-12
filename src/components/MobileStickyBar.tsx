'use client'

import { usePathname } from 'next/navigation'
import { MessageCircle, Phone } from 'lucide-react'
import CallLink from './CallLink'
import { PRIMARY_PHONE } from '@/lib/nap'

// Same bar on every page: Free Demo is the one primary action (solid --primary-fill);
// Call and WhatsApp are secondary (outlined). Hidden from 768px up.
const SECONDARY =
  'flex min-h-12 items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-[#cfdadd] bg-white px-1.5 font-sans text-[15px] font-bold dark:border-slate-600 dark:bg-slate-950'

export default function MobileStickyBar() {
  const pathname = usePathname()

  function openWhatsApp() {
    window.dispatchEvent(new CustomEvent('coss:open-whatsapp', { detail: { origin: 'sticky' } }))
  }

  // The homepage has the demo form on the page; everywhere else the demo page.
  const demoHref = pathname === '/' ? '#enroll-form' : '/free-demo-class'

  return (
    <nav aria-label="Quick actions" className="fixed bottom-0 left-0 right-0 z-[9998] md:hidden">
      <div
        className="grid grid-cols-[1fr_1fr_1.6fr] gap-2 border-t border-[#e3eaec] bg-white px-3 py-2.5 shadow-[0_-8px_24px_-12px_rgba(10,61,74,0.35)] dark:border-slate-800 dark:bg-slate-950"
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
      >
        <CallLink
          number={PRIMARY_PHONE}
          className={`${SECONDARY} text-[#005663] dark:text-[#5ef0c8]`}
          aria-label="Call Now: Coss Cloud Solutions"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          Call
        </CallLink>
        <button
          type="button"
          onClick={openWhatsApp}
          className={`${SECONDARY} text-[var(--wa-text)]`}
          aria-label="Open WhatsApp chat"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          WhatsApp
        </button>
        <a
          href={demoHref}
          className="flex min-h-12 items-center justify-center rounded-xl bg-[var(--primary-fill)] px-1.5 font-sans text-[15px] font-bold text-white"
          aria-label="Book a free demo class"
        >
          Free demo
        </a>
      </div>
    </nav>
  )
}

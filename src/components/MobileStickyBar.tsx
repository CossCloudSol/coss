'use client'

import CallLink from './CallLink'

export default function MobileStickyBar() {
  const phone = '+918885166007'

  function openWhatsApp() {
    window.dispatchEvent(new CustomEvent('coss:open-whatsapp', { detail: { origin: 'sticky' } }))
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] md:hidden">
      <div
        className="bg-[#0d1b2e] border-t-[2.5px] border-orange-500 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-4">

          {/* Call Now */}
          <CallLink
            number={phone}
            className="flex flex-col items-center justify-center gap-1 py-3 text-slate-300 hover:bg-white/5 active:bg-white/10 transition-colors border-r border-slate-700/60"
            aria-label="Call Coss Cloud Solutions"
          >
            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/>
            </svg>
            <span className="text-[10px] font-bold tracking-wide leading-none">Call Now</span>
          </CallLink>

          {/* WhatsApp — triggers lead-capture widget */}
          <button
            onClick={openWhatsApp}
            className="flex flex-col items-center justify-center gap-1 py-3 w-full text-slate-300 hover:bg-white/5 active:bg-white/10 transition-colors border-r border-slate-700/60"
            aria-label="Open WhatsApp chat"
          >
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="text-[10px] font-bold tracking-wide leading-none">WhatsApp</span>
          </button>

          {/* Book Demo — orange bg */}
          <a
            href="/free-demo-class"
            className="flex flex-col items-center justify-center gap-1 py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 transition-colors border-r border-orange-600/40"
            aria-label="Book a free demo class"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
            </svg>
            <span className="text-[10px] font-bold text-white tracking-wide leading-none">Book Demo</span>
          </a>

          {/* Enroll Now — teal bg */}
          <a
            href="/enroll-now-with-coss"
            className="flex flex-col items-center justify-center gap-1 py-3 bg-[#005663] hover:bg-[#006d7a] active:bg-[#004d58] transition-colors"
            aria-label="Enroll now at Coss Cloud Solutions"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"/>
            </svg>
            <span className="text-[10px] font-bold text-white tracking-wide leading-none">Enroll Now</span>
          </a>

        </div>
      </div>
    </div>
  )
}

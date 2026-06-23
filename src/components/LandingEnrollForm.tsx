'use client'

import { useState } from 'react'
import { submitLead, type Branch } from '@/lib/submitLead'

interface Props {
  courseTitle: string
  duration: string
  level: string
  phone1: string
}

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

export default function LandingEnrollForm({ courseTitle, duration, level, phone1 }: Props) {
  const [state, setState] = useState<SubmitState>({ kind: 'idle' })
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [branch, setBranch] = useState<'Dilsukhnagar' | 'Ameerpet'>('Dilsukhnagar')
  const [batch, setBatch] = useState<string>('Weekday Mon-Fri')

  const waLink = `https://wa.me/${phone1.replace(/\D/g, '')}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    setState({ kind: 'submitting' })
    const result = await submitLead({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      course: courseTitle,
      inquiryType: 'Demo Class',
      branch: branch as Branch,
      message: `Batch preference: ${batch}`,
      formType: 'demo',
    })
    setState(result.ok ? { kind: 'success' } : { kind: 'error', message: result.message })
  }

  if (state.kind === 'success') {
    return (
      <div className="rounded-2xl bg-white shadow-2xl border-t-4 border-t-green-500 p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900">Seat Reserved! We&apos;ll Call Within 2 Hours.</h3>
        <p className="mt-2 text-sm text-gray-600">Our counsellor will reach you on WhatsApp to confirm your free demo slot.</p>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#20BD5C]"
        >
          <WaIcon /> Chat on WhatsApp
        </a>
      </div>
    )
  }

  const isSubmitting = state.kind === 'submitting'

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] border border-slate-100 dark:border-slate-700 relative overflow-hidden w-full max-w-full">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-400 rounded-t-2xl" />
      <div className="text-center mb-5 pt-2">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Book Your{' '}
          <span className="text-orange-500">FREE</span>{' '}
          Demo
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
          Limited Seats. Reserve your spot now!
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex items-center gap-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3.5 mb-3 bg-white dark:bg-slate-800 focus-within:border-orange-400 dark:focus-within:border-orange-500 transition-colors duration-200 w-full">
          <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
          </svg>
          <input
            id="lef-name"
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name"
            disabled={isSubmitting}
            className="flex-1 min-w-0 bg-transparent outline-none text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 font-medium"
          />
        </div>
        <div className="flex items-center gap-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3.5 mb-3 bg-white dark:bg-slate-800 focus-within:border-orange-400 dark:focus-within:border-orange-500 transition-colors duration-200 w-full">
          <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/>
          </svg>
          <input
            id="lef-phone"
            type="tel"
            required
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+91 XXXXX XXXXX"
            inputMode="numeric"
            disabled={isSubmitting}
            className="flex-1 min-w-0 bg-transparent outline-none text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 font-medium"
          />
        </div>
        <div className="flex items-center gap-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3.5 mb-3 bg-white dark:bg-slate-800 focus-within:border-orange-400 dark:focus-within:border-orange-500 transition-colors duration-200 w-full">
          <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/>
          </svg>
          <input
            id="lef-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com (optional)"
            disabled={isSubmitting}
            className="flex-1 min-w-0 bg-transparent outline-none text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 font-medium"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
          <div className="flex items-center gap-2 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-3 py-3.5 bg-white dark:bg-slate-800 focus-within:border-orange-400 transition-colors duration-200">
            <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
            </svg>
            <select
              id="lef-branch"
              value={branch}
              onChange={e => setBranch(e.target.value as 'Dilsukhnagar' | 'Ameerpet')}
              disabled={isSubmitting}
              className="flex-1 min-w-0 bg-transparent outline-none text-slate-600 dark:text-slate-300 text-sm font-medium cursor-pointer"
            >
              <option value="Dilsukhnagar">Dilsukhnagar</option>
              <option value="Ameerpet">Ameerpet</option>
            </select>
          </div>
          <div className="flex items-center gap-2 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-3 py-3.5 bg-white dark:bg-slate-800 focus-within:border-orange-400 transition-colors duration-200">
            <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
            </svg>
            <select
              id="lef-batch"
              value={batch}
              onChange={e => setBatch(e.target.value)}
              disabled={isSubmitting}
              className="flex-1 min-w-0 bg-transparent outline-none text-slate-600 dark:text-slate-300 text-sm font-medium cursor-pointer"
            >
              <option value="Weekday Mon-Fri">Weekday (Mon–Fri)</option>
              <option value="Weekend Sat-Sun">Weekend (Sat–Sun)</option>
            </select>
          </div>
        </div>

        {state.kind === 'error' && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700" role="alert">
            {state.message}
          </p>
        )}

        <div className="flex items-center justify-between text-xs mb-3 flex-wrap gap-1">
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            12 people viewing this right now
          </span>
          <span className="text-orange-600 font-semibold">Only 4 seats left!</span>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-base font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 mb-3 disabled:opacity-70"
        >
          {isSubmitting ? 'Booking Your Seat…' : 'Reserve My Free Demo Seat →'}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
          </svg>
        </button>

      </form>

      <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
          </svg>
          Free · No Obligation
        </span>
        <span className="text-orange-500 font-semibold">Limited seats!</span>
      </div>
    </div>
  )
}

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

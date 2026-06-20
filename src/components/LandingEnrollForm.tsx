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

  const inputCls =
    'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-60'

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
    <div className="rounded-2xl bg-white shadow-2xl border-t-4 border-t-orange-500 p-6">
      <h3 className="text-xl font-bold text-gray-900">
        Book Your <span className="text-blue-700">FREE</span> Demo Class
      </h3>
      <p className="mt-0.5 text-sm text-gray-500">Limited seats — join the next batch now!</p>
      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-medium text-green-700">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
        Free career guidance + resume review
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="lef-name">Full Name *</label>
          <input
            id="lef-name"
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name"
            disabled={isSubmitting}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="lef-phone">Phone Number *</label>
          <input
            id="lef-phone"
            type="tel"
            required
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+91 XXXXX XXXXX"
            inputMode="numeric"
            disabled={isSubmitting}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="lef-email">Email Address</label>
          <input
            id="lef-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com (optional)"
            disabled={isSubmitting}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="lef-branch">Select Centre</label>
          <select
            id="lef-branch"
            value={branch}
            onChange={e => setBranch(e.target.value as 'Dilsukhnagar' | 'Ameerpet')}
            disabled={isSubmitting}
            className={inputCls}
          >
            <option value="Dilsukhnagar">Dilsukhnagar</option>
            <option value="Ameerpet">Ameerpet</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="lef-batch">Select Batch</label>
          <select
            id="lef-batch"
            value={batch}
            onChange={e => setBatch(e.target.value)}
            disabled={isSubmitting}
            className={inputCls}
          >
            <option value="Weekday Mon-Fri">Weekday (Mon–Fri)</option>
            <option value="Weekend Sat-Sun">Weekend (Sat–Sun)</option>
          </select>
        </div>

        {state.kind === 'error' && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700" role="alert">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700 disabled:opacity-70 transition-all"
        >
          {isSubmitting ? 'Booking Your Seat…' : 'Reserve My Free Demo Seat →'}
        </button>

        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white hover:bg-[#20BD5C] transition-colors"
        >
          <WaIcon /> Chat on WhatsApp Now
        </a>

        <p className="text-center text-xs text-gray-400">🛡 No spam · No obligation · 100% free</p>
      </form>

      <dl className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
        {[
          { label: 'Duration', value: duration || '3 months' },
          { label: 'Next Batch', value: 'Starting Soon' },
          { label: 'Mode', value: 'Online + Offline' },
          { label: 'Level', value: level || 'All Levels' },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <dt className="text-[10px] uppercase tracking-wide text-gray-400">{label}</dt>
            <dd className="mt-0.5 text-xs font-semibold text-gray-800">{value}</dd>
          </div>
        ))}
      </dl>
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

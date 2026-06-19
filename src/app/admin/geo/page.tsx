'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'

type BranchKey = 'dilsukhnagar' | 'ameerpet'

type FormState = {
  branchName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
  phone: string
  email: string
  latitude: string
  longitude: string
  workingHoursOpen: string
  workingHoursClose: string
  workingDays: string
  mapEmbedUrl: string
  serviceAreas: string[]
  aggregateRating: string
  reviewCount: string
  schemaEnabled: boolean
}

const EMPTY_FORM: FormState = {
  branchName: '',
  addressLine1: '',
  addressLine2: '',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '',
  phone: '',
  email: '',
  latitude: '',
  longitude: '',
  workingHoursOpen: '09:00',
  workingHoursClose: '19:00',
  workingDays: 'Monday-Saturday',
  mapEmbedUrl: '',
  serviceAreas: [],
  aggregateRating: '4.8',
  reviewCount: '0',
  schemaEnabled: true,
}

const BRANCH_LABELS: Record<BranchKey, string> = {
  dilsukhnagar: 'Dilsukhnagar',
  ameerpet: 'Ameerpet',
}

function rowToForm(row: Record<string, unknown>): FormState {
  return {
    branchName:        String(row.branchName        ?? ''),
    addressLine1:      String(row.addressLine1      ?? ''),
    addressLine2:      String(row.addressLine2      ?? ''),
    city:              String(row.city              ?? 'Hyderabad'),
    state:             String(row.state             ?? 'Telangana'),
    pincode:           String(row.pincode           ?? ''),
    phone:             String(row.phone             ?? ''),
    email:             String(row.email             ?? ''),
    latitude:          String(row.latitude          ?? ''),
    longitude:         String(row.longitude         ?? ''),
    workingHoursOpen:  String(row.workingHoursOpen  ?? '09:00'),
    workingHoursClose: String(row.workingHoursClose ?? '19:00'),
    workingDays:       String(row.workingDays       ?? 'Monday-Saturday'),
    mapEmbedUrl:       String(row.mapEmbedUrl       ?? ''),
    serviceAreas:      Array.isArray(row.serviceAreas)
      ? (row.serviceAreas as string[])
      : JSON.parse(String(row.serviceAreas || '[]')),
    aggregateRating:   String(row.aggregateRating   ?? '4.8'),
    reviewCount:       String(row.reviewCount       ?? '0'),
    schemaEnabled:     Boolean(row.schemaEnabled    ?? true),
  }
}

type SectionProps = {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="font-semibold text-gray-800 text-sm">{title}</span>
        <span className="text-gray-400 text-lg leading-none">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-5 py-5 space-y-4 bg-white">{children}</div>}
    </div>
  )
}

type FieldProps = {
  label: string
  children: React.ReactNode
}

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

export default function GeoManagerPage() {
  const [activeBranch, setActiveBranch] = useState<BranchKey>('dilsukhnagar')
  const [forms, setForms] = useState<Record<BranchKey, FormState>>({
    dilsukhnagar: { ...EMPTY_FORM },
    ameerpet: { ...EMPTY_FORM },
  })
  const [areaInput, setAreaInput] = useState<Record<BranchKey, string>>({
    dilsukhnagar: '',
    ameerpet: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const loadBranch = useCallback(async (key: BranchKey) => {
    try {
      const res = await fetch(`/api/admin/geo/${key}`)
      if (!res.ok) return
      const row = await res.json()
      setForms(prev => ({ ...prev, [key]: rowToForm(row) }))
    } catch {
      // keep empty form on load error
    }
  }, [])

  useEffect(() => {
    loadBranch('dilsukhnagar')
    loadBranch('ameerpet')
  }, [loadBranch])

  const form = forms[activeBranch]

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForms(prev => ({
      ...prev,
      [activeBranch]: { ...prev[activeBranch], [key]: value },
    }))
  }

  function addArea() {
    const val = areaInput[activeBranch].trim()
    if (!val) return
    setField('serviceAreas', [...form.serviceAreas, val])
    setAreaInput(prev => ({ ...prev, [activeBranch]: '' }))
  }

  function removeArea(idx: number) {
    setField('serviceAreas', form.serviceAreas.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch(`/api/admin/geo/${activeBranch}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          latitude:        parseFloat(form.latitude)  || 0,
          longitude:       parseFloat(form.longitude) || 0,
          aggregateRating: parseFloat(form.aggregateRating) || 4.8,
          reviewCount:     parseInt(form.reviewCount)       || 0,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Save failed — check console')
    } finally {
      setSaving(false)
    }
  }

  const mapsHref =
    form.latitude && form.longitude
      ? `https://maps.google.com/?q=${form.latitude},${form.longitude}`
      : '#'

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">GEO &amp; Local SEO Manager</h1>
        <p className="mt-1 text-sm text-gray-500">Branch location data, coordinates, and LocalBusiness schema</p>
      </div>

      {/* Status banners */}
      {saved && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          Saved successfully
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Branch tabs */}
      <div className="flex gap-2">
        {(Object.keys(BRANCH_LABELS) as BranchKey[]).map(key => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveBranch(key)}
            className={[
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeBranch === key
                ? 'bg-blue-600 text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50',
            ].join(' ')}
          >
            {BRANCH_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Section 1 — Branch NAP */}
      <Section title="Branch NAP">
        <Field label="Branch Name">
          <input className={inputCls} value={form.branchName} onChange={e => setField('branchName', e.target.value)} />
        </Field>
        <Field label="Address Line 1">
          <input className={inputCls} value={form.addressLine1} onChange={e => setField('addressLine1', e.target.value)} />
        </Field>
        <Field label="Address Line 2">
          <input className={inputCls} value={form.addressLine2} onChange={e => setField('addressLine2', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="City">
            <input className={inputCls} value={form.city} onChange={e => setField('city', e.target.value)} />
          </Field>
          <Field label="State">
            <input className={inputCls} value={form.state} onChange={e => setField('state', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Pincode">
            <input className={inputCls} value={form.pincode} onChange={e => setField('pincode', e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={form.phone} onChange={e => setField('phone', e.target.value)} />
          </Field>
        </div>
        <Field label="Email">
          <input className={inputCls} type="email" value={form.email} onChange={e => setField('email', e.target.value)} />
        </Field>
      </Section>

      {/* Section 2 — Coordinates & Map */}
      <Section title="Coordinates &amp; Map">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitude">
            <input
              className={inputCls}
              type="number"
              step="0.000001"
              value={form.latitude}
              onChange={e => setField('latitude', e.target.value)}
            />
          </Field>
          <Field label="Longitude">
            <input
              className={inputCls}
              type="number"
              step="0.000001"
              value={form.longitude}
              onChange={e => setField('longitude', e.target.value)}
            />
          </Field>
        </div>
        {form.latitude && form.longitude && (
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
          >
            View on Google Maps ↗
          </a>
        )}
        <Field label="Map Embed URL">
          <textarea
            className={`${inputCls} h-20 resize-none`}
            value={form.mapEmbedUrl}
            onChange={e => setField('mapEmbedUrl', e.target.value)}
            placeholder="Paste Google Maps embed URL (src=...)"
          />
        </Field>
      </Section>

      {/* Section 3 — Service Areas */}
      <Section title="Service Areas">
        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {form.serviceAreas.map((area, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-200"
            >
              {area}
              <button
                type="button"
                onClick={() => removeArea(idx)}
                className="ml-0.5 hover:text-blue-900 font-bold leading-none"
                aria-label={`Remove ${area}`}
              >
                ×
              </button>
            </span>
          ))}
          {form.serviceAreas.length === 0 && (
            <span className="text-sm text-gray-400">No areas added yet</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            className={`${inputCls} flex-1`}
            placeholder="Add a service area…"
            value={areaInput[activeBranch]}
            onChange={e => setAreaInput(prev => ({ ...prev, [activeBranch]: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addArea())}
          />
          <button
            type="button"
            onClick={addArea}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
          >
            Add
          </button>
        </div>
      </Section>

      {/* Section 4 — Schema & Reviews */}
      <Section title="Schema &amp; Reviews">
        {/* schemaEnabled toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={form.schemaEnabled}
            onClick={() => setField('schemaEnabled', !form.schemaEnabled)}
            className={[
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
              form.schemaEnabled ? 'bg-blue-600' : 'bg-gray-200',
            ].join(' ')}
          >
            <span
              className={[
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform',
                form.schemaEnabled ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
          <span className="text-sm text-gray-700">Include LocalBusiness JSON-LD for this branch</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Aggregate Rating (1–5)">
            <input
              className={inputCls}
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={form.aggregateRating}
              onChange={e => setField('aggregateRating', e.target.value)}
            />
          </Field>
          <Field label="Review Count">
            <input
              className={inputCls}
              type="number"
              value={form.reviewCount}
              onChange={e => setField('reviewCount', e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Opening Time">
            <input
              className={inputCls}
              type="time"
              value={form.workingHoursOpen}
              onChange={e => setField('workingHoursOpen', e.target.value)}
            />
          </Field>
          <Field label="Closing Time">
            <input
              className={inputCls}
              type="time"
              value={form.workingHoursClose}
              onChange={e => setField('workingHoursClose', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Working Days">
          <input
            className={inputCls}
            value={form.workingDays}
            onChange={e => setField('workingDays', e.target.value)}
            placeholder="e.g. Monday-Saturday"
          />
        </Field>
      </Section>

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : `Save ${BRANCH_LABELS[activeBranch]}`}
        </button>
      </div>
    </div>
  )
}

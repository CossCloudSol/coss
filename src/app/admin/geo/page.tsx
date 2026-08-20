'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'

type BranchData = {
  id: string
  branchKey: string
  branchName: string
}

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
  reviewCount: string
  schemaEnabled: boolean
}

type AddBranchForm = {
  branchName: string
  branchKey: string
  addressLine1: string
  pincode: string
  phone: string
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
  workingDays: 'Monday-Sunday',
  mapEmbedUrl: '',
  serviceAreas: [],
  reviewCount: '0',
  schemaEnabled: true,
}

const EMPTY_ADD_FORM: AddBranchForm = {
  branchName: '',
  branchKey: '',
  addressLine1: '',
  pincode: '',
  phone: '',
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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
    workingDays:       String(row.workingDays       ?? 'Monday-Sunday'),
    mapEmbedUrl:       String(row.mapEmbedUrl       ?? ''),
    serviceAreas:      Array.isArray(row.serviceAreas)
      ? (row.serviceAreas as string[])
      : JSON.parse(String(row.serviceAreas || '[]')),
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
    <div className="bg-white dark:bg-gray-800 border border-[#c9e8ed] dark:border-gray-700 rounded-xl overflow-hidden mb-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-[#e6f4f6] dark:bg-gray-800/60 hover:bg-[#c9e8ed] dark:hover:bg-gray-700/50 transition-colors text-left"
      >
        <span className="font-semibold text-[#0f172a] dark:text-gray-200 text-sm">{title}</span>
        <span className="text-[#94a3b8] dark:text-gray-400 text-lg leading-none">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-5 py-5 space-y-4 bg-white dark:bg-gray-800 dark:border-t dark:border-gray-700">{children}</div>}
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
      <label className="block text-sm font-medium text-[#475569] dark:text-gray-300 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-[#e6f4f6] dark:bg-gray-700 border border-[#c9e8ed] dark:border-gray-600 rounded-lg px-3 py-2 text-[#0f172a] dark:text-gray-100 text-sm placeholder:text-[#94a3b8] dark:placeholder-gray-500 focus:outline-none focus:border-[#024c57] focus:ring-1 focus:ring-[#024c57]/20'

export default function GeoManagerPage() {
  const [branches, setBranches] = useState<BranchData[]>([])
  const [activeBranch, setActiveBranch] = useState<string>('')
  const [forms, setForms] = useState<Record<string, FormState>>({})
  const [areaInput, setAreaInput] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<AddBranchForm>({ ...EMPTY_ADD_FORM })
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)

  const loadBranch = useCallback(async (key: string) => {
    try {
      const res = await fetch(`/api/admin/geo/${key}`)
      if (!res.ok) return
      const row = await res.json()
      setForms(prev => ({ ...prev, [key]: rowToForm(row) }))
    } catch {
      // keep empty form on load error
    }
  }, [])

  const loadBranches = useCallback(async (): Promise<BranchData[]> => {
    try {
      const res = await fetch('/api/admin/geo/branches')
      if (!res.ok) return []
      const data = await res.json()
      const list: BranchData[] = data.branches ?? []
      setBranches(list)
      setForms(prev => {
        const next = { ...prev }
        list.forEach(b => { if (!next[b.branchKey]) next[b.branchKey] = { ...EMPTY_FORM } })
        return next
      })
      setAreaInput(prev => {
        const next = { ...prev }
        list.forEach(b => { if (next[b.branchKey] === undefined) next[b.branchKey] = '' })
        return next
      })
      return list
    } catch {
      return []
    }
  }, [])

  useEffect(() => {
    loadBranches().then(list => {
      if (!list || list.length === 0) return
      setActiveBranch(list[0].branchKey)
      list.forEach(b => loadBranch(b.branchKey))
    })
  }, [loadBranches, loadBranch])

  const form = forms[activeBranch] ?? { ...EMPTY_FORM }
  const activeBranchName = branches.find(b => b.branchKey === activeBranch)?.branchName ?? activeBranch

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForms(prev => ({
      ...prev,
      [activeBranch]: { ...(prev[activeBranch] ?? EMPTY_FORM), [key]: value },
    }))
  }

  function addArea() {
    const val = (areaInput[activeBranch] ?? '').trim()
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

  async function handleAddBranch() {
    setAdding(true)
    setAddError('')
    try {
      const res = await fetch('/api/admin/geo/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error((e as { error?: string }).error ?? 'Create failed')
      }
      const created = await res.json() as { branchKey: string }
      await loadBranches()
      await loadBranch(created.branchKey)
      setActiveBranch(created.branchKey)
      setShowAddForm(false)
      setAddForm({ ...EMPTY_ADD_FORM })
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setAdding(false)
    }
  }

  async function handleDeleteBranch(key: string) {
    const branch = branches.find(b => b.branchKey === key)
    if (!branch) return
    if (!confirm(`Delete "${branch.branchName}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/geo/branches/${key}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      const list = await loadBranches()
      if (list.length > 0) setActiveBranch(list[0].branchKey)
    } catch {
      setError('Delete failed — check console')
    }
  }

  const mapsHref =
    form.latitude && form.longitude
      ? `https://maps.google.com/?q=${form.latitude},${form.longitude}`
      : '#'

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white">GEO &amp; Local SEO Manager</h1>
        <p className="mt-1 text-sm text-[#475569] dark:text-gray-400">Branch location data, coordinates, and LocalBusiness schema</p>
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

      {/* Branch tabs + Add branch button */}
      <div className="flex flex-wrap gap-2 items-center">
        {branches.map(b => (
          <div key={b.branchKey} className="relative flex items-center">
            <button
              type="button"
              onClick={() => setActiveBranch(b.branchKey)}
              className={[
                'pl-4 pr-8 py-1.5 rounded-lg text-sm font-medium transition-colors',
                activeBranch === b.branchKey
                  ? 'bg-[#024c57] text-white dark:bg-[#024c57]'
                  : 'bg-white dark:bg-gray-800 border border-[#c9e8ed] dark:border-gray-600 text-[#475569] dark:text-gray-300 hover:bg-[#e6f4f6] dark:hover:bg-gray-700',
              ].join(' ')}
            >
              {b.branchName || b.branchKey}
            </button>
            {branches.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteBranch(b.branchKey)}
                title={`Delete ${b.branchName || b.branchKey}`}
                aria-label={`Delete ${b.branchName || b.branchKey}`}
                className={[
                  'absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded text-xs font-bold leading-none transition-colors',
                  activeBranch === b.branchKey
                    ? 'text-white/70 hover:text-white hover:bg-[#03798a]'
                    : 'text-gray-400 hover:text-red-600 hover:bg-red-50',
                ].join(' ')}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => { setShowAddForm(v => !v); setAddError('') }}
          className="flex items-center gap-2 border-2 border-dashed border-[#024c57] dark:border-gray-600 text-[#024c57] dark:text-gray-400 bg-[#e6f4f6] dark:bg-transparent hover:bg-[#c9e8ed] dark:hover:bg-gray-700 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
        >
          + Add branch
        </button>
      </div>

      {/* Add branch inline form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 border border-[#c9e8ed] dark:border-gray-700 rounded-xl px-5 py-5 space-y-4">
          <h2 className="font-semibold text-[#0f172a] dark:text-gray-200 text-sm">New Branch</h2>
          {addError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
              {addError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Branch Name">
              <input
                className={inputCls}
                value={addForm.branchName}
                onChange={e => {
                  const name = e.target.value
                  setAddForm(f => ({ ...f, branchName: name, branchKey: slugify(name) }))
                }}
                placeholder="e.g. Coss Cloud — HITEC City"
              />
            </Field>
            <Field label="Branch Key (slug)">
              <input
                className={inputCls}
                value={addForm.branchKey}
                onChange={e => setAddForm(f => ({ ...f, branchKey: e.target.value }))}
                placeholder="e.g. hitec-city"
              />
            </Field>
          </div>
          <Field label="Address Line 1">
            <input
              className={inputCls}
              value={addForm.addressLine1}
              onChange={e => setAddForm(f => ({ ...f, addressLine1: e.target.value }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Pincode">
              <input
                className={inputCls}
                value={addForm.pincode}
                onChange={e => setAddForm(f => ({ ...f, pincode: e.target.value }))}
              />
            </Field>
            <Field label="Phone">
              <input
                className={inputCls}
                value={addForm.phone}
                onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
              />
            </Field>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddBranch}
              disabled={adding || !addForm.branchKey || !addForm.branchName}
              className="px-4 py-2 bg-[#024c57] text-white text-sm font-semibold rounded-lg hover:bg-[#03798a] disabled:opacity-60 transition-colors"
            >
              {adding ? 'Creating…' : 'Create branch'}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setAddForm({ ...EMPTY_ADD_FORM }); setAddError('') }}
              className="px-4 py-2 border border-[#e2e8f0] dark:border-gray-600 text-[#475569] dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
            className="inline-flex items-center gap-1.5 text-[#03798a] dark:text-teal-400 font-medium text-sm underline"
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
              className="inline-flex items-center gap-1 bg-[#e6f4f6] dark:bg-blue-900/30 border border-[#024c57] dark:border-blue-700 text-[#024c57] dark:text-blue-400 rounded-full px-2 py-0.5 text-xs font-medium"
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
            <span className="text-sm text-[#94a3b8] dark:text-gray-500">No areas added yet</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            className={`${inputCls} flex-1`}
            placeholder="Add a service area…"
            value={areaInput[activeBranch] ?? ''}
            onChange={e => setAreaInput(prev => ({ ...prev, [activeBranch]: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addArea())}
          />
          <button
            type="button"
            onClick={addArea}
            className="px-4 py-2 bg-[#024c57] dark:bg-gray-700 text-white text-sm rounded-lg hover:bg-[#03798a] dark:hover:bg-gray-600 transition-colors"
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
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#024c57]/40',
              form.schemaEnabled ? 'bg-[#024c57]' : 'bg-gray-200',
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
      <div className="pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !activeBranch}
          className="w-full bg-[#024c57] text-white rounded-xl py-3 font-medium text-sm hover:bg-[#03798a] disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : `Save ${activeBranchName}`}
        </button>
      </div>
    </div>
  )
}

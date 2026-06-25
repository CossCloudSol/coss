'use client'

import { useState, useEffect, useRef } from 'react'

interface HiringPartner {
  id: string
  name: string
  logoUrl: string
  altText: string
  website: string
  isVisible: boolean
  sortOrder: number
}

interface ScanResult {
  id: string
  name: string
  logoUrl: string
  status: number
  ok: boolean
}

export default function HiringPartnersPage() {
  const [partners, setPartners]       = useState<HiringPartner[]>([])
  const [loading, setLoading]         = useState(true)
  const [scanning, setScanning]       = useState(false)
  const [scanResults, setScanResults] = useState<ScanResult[] | null>(null)
  const [showForm, setShowForm]       = useState(false)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [saving, setSaving]           = useState(false)

  const [form, setForm] = useState({
    name: '', logoUrl: '', altText: '', website: '', isVisible: true, sortOrder: 0,
  })

  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)

  useEffect(() => { fetchPartners() }, [])

  async function fetchPartners() {
    setLoading(true)
    const res = await fetch('/api/admin/hiring-partners')
    const data = await res.json()
    setPartners(data)
    setLoading(false)
  }

  async function toggleVisible(p: HiringPartner) {
    await fetch(`/api/admin/hiring-partners/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisible: !p.isVisible }),
    })
    setPartners(prev => prev.map(x => x.id === p.id ? { ...x, isVisible: !x.isVisible } : x))
  }

  async function deletePartner(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    await fetch(`/api/admin/hiring-partners/${id}`, { method: 'DELETE' })
    setPartners(prev => prev.filter(x => x.id !== id))
  }

  async function savePartner() {
    setSaving(true)
    const url    = editingId ? `/api/admin/hiring-partners/${editingId}` : '/api/admin/hiring-partners'
    const method = editingId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (editingId) {
      setPartners(prev => prev.map(x => x.id === editingId ? data : x))
    } else {
      setPartners(prev => [...prev, data].sort((a, b) => a.sortOrder - b.sortOrder))
    }
    resetForm()
    setSaving(false)
  }

  function resetForm() {
    setForm({ name: '', logoUrl: '', altText: '', website: '', isVisible: true, sortOrder: 0 })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(p: HiringPartner) {
    setForm({ name: p.name, logoUrl: p.logoUrl, altText: p.altText, website: p.website, isVisible: p.isVisible, sortOrder: p.sortOrder })
    setEditingId(p.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleDragStart(index: number) { dragItem.current = index }
  function handleDragEnter(index: number) { dragOver.current = index }

  async function handleDragEnd() {
    if (dragItem.current === null || dragOver.current === null) return
    const reordered = [...partners]
    const [moved] = reordered.splice(dragItem.current, 1)
    reordered.splice(dragOver.current, 0, moved)
    dragItem.current = null
    dragOver.current = null
    setPartners(reordered)
    await fetch('/api/admin/hiring-partners/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map(p => p.id) }),
    })
  }

  async function runScan() {
    setScanning(true)
    const res = await fetch('/api/admin/hiring-partners/scan', { method: 'POST' })
    const data = await res.json()
    setScanResults(data)
    setScanning(false)
  }

  const visible = partners.filter(p => p.isVisible).length
  const hidden  = partners.filter(p => !p.isVisible).length
  const broken  = scanResults ? scanResults.filter(r => !r.ok).length : 0

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">Hiring partners</h1>
          <p className="text-sm text-gray-400 mt-1">
            Company logos shown on homepage · course pages · placements page
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runScan}
            disabled={scanning}
            className="px-3 py-2 text-sm border border-white/10 rounded-lg bg-transparent text-gray-300 hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
          >
            {scanning ? 'Scanning…' : 'Scan dead logos'}
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="px-4 py-2 text-sm rounded-lg text-white flex items-center gap-2"
            style={{ background: '#023340' }}
          >
            + Add partner
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',        val: partners.length,                       color: '' },
          { label: 'Visible',      val: visible,                               color: 'text-teal-400' },
          { label: 'Hidden',       val: hidden,                                color: '' },
          { label: 'Broken logos', val: scanResults ? broken : '—',            color: broken > 0 ? 'text-red-400' : 'text-teal-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-semibold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="border border-white/10 rounded-xl p-5 bg-gray-800 mb-6">
          <h2 className="text-sm font-medium text-gray-100 mb-4">
            {editingId ? 'Edit partner' : 'Add hiring partner'}
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Company name</label>
              <input
                className="w-full bg-gray-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Tata Consultancy Services"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Alt text (SEO)</label>
              <input
                className="w-full bg-gray-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100"
                value={form.altText}
                onChange={e => setForm(f => ({ ...f, altText: e.target.value }))}
                placeholder="e.g. TCS — Coss hiring partner"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs text-gray-400 block mb-1">Logo URL (Cloudinary)</label>
            <input
              className="w-full bg-gray-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100"
              value={form.logoUrl}
              onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
              placeholder="https://res.cloudinary.com/dfditihuw/…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Website URL</label>
              <input
                className="w-full bg-gray-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100"
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://www.tcs.com"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Sort order</label>
              <input
                type="number"
                className="w-full bg-gray-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100"
                value={form.sortOrder}
                onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={e => setForm(f => ({ ...f, isVisible: e.target.checked }))}
                className="w-4 h-4"
              />
              Visible on site
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={resetForm} className="px-4 py-2 text-sm border border-white/10 rounded-lg bg-transparent text-gray-300">
              Cancel
            </button>
            <button
              onClick={savePartner}
              disabled={saving || !form.name}
              className="px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50"
              style={{ background: '#023340' }}
            >
              {saving ? 'Saving…' : editingId ? 'Update partner' : 'Save partner'}
            </button>
          </div>
        </div>
      )}

      {/* Instruction */}
      <p className="text-xs text-gray-500 mb-3">
        Drag cards to reorder · click Edit to update logo URL or details
      </p>

      {/* Partner grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-8">
          {partners.map((p, index) => {
            const scanResult = scanResults?.find(r => r.id === p.id)
            const isBroken   = scanResult && !scanResult.ok
            return (
              <div
                key={p.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={e => e.preventDefault()}
                className={`relative border rounded-xl p-3 bg-gray-800 cursor-grab transition-opacity ${
                  !p.isVisible ? 'opacity-40' : ''
                } ${isBroken ? 'border-red-500/50' : 'border-white/10'}`}
              >
                {isBroken && (
                  <span className="absolute top-2 right-2 text-xs px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">
                    404
                  </span>
                )}

                <div className="h-10 flex items-center justify-center mb-2">
                  {p.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.logoUrl}
                      alt={p.altText || p.name}
                      className="max-h-8 max-w-full object-contain grayscale"
                    />
                  ) : (
                    <span className="text-xs text-gray-500">{p.name}</span>
                  )}
                </div>

                <p className="text-xs text-gray-400 text-center truncate mb-2">{p.name}</p>

                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => toggleVisible(p)}
                    className="px-2 py-1 text-xs border border-white/10 rounded bg-transparent text-gray-400 hover:text-gray-200"
                  >
                    {p.isVisible ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => startEdit(p)}
                    className="px-2 py-1 text-xs border border-white/10 rounded bg-transparent text-gray-400 hover:text-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deletePartner(p.id, p.name)}
                    className="px-2 py-1 text-xs border border-red-500/20 rounded bg-transparent text-red-400 hover:bg-red-500/10"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Scan results */}
      {scanResults && (
        <div className="border border-white/10 rounded-xl overflow-hidden mb-6">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-white/10">
            <span className="text-sm font-medium text-gray-100">Logo scan results</span>
            <span className="text-xs text-gray-500">
              {scanResults.filter(r => r.ok).length} ok · {broken} broken
            </span>
          </div>
          {scanResults.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200">{r.name}</p>
                <p className="text-xs text-gray-500 truncate">{r.logoUrl || '— no URL set'}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                r.ok ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {r.ok ? `${r.status} OK` : r.status === 0 ? 'timeout' : `${r.status}`}
              </span>
              {!r.ok && (
                <button
                  onClick={() => startEdit(partners.find(p => p.id === r.id)!)}
                  className="text-xs px-2 py-1 border border-white/10 rounded text-gray-300 hover:bg-gray-700"
                >
                  Fix
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

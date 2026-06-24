'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/* ─── Types ─────────────────────────────────────────────────────────────────── */

interface Testimonial {
  id: string
  name: string
  jobTitle: string | null
  company: string | null
  quote: string
  rating: number
  photoUrl: string | null
  scope: string
  courseSlug: string | null
  visible: boolean
  sortOrder: number
  source: string | null
  reviewDate: string | null
  createdAt: string
  updatedAt: string
}

interface ImportRow {
  name: string
  quote: string
  rating: number
  photoUrl: string
  reviewDate: string
  scope: string
  source: string
}

type Tab = 'all' | 'add' | 'import'

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={`text-xl leading-none ${onChange ? 'cursor-pointer' : 'cursor-default'} ${n <= value ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className="h-10 w-10 rounded-full object-cover shrink-0"
        onError={(e) => {
          const t = e.currentTarget
          t.style.display = 'none'
          if (t.nextSibling) (t.nextSibling as HTMLElement).style.display = 'flex'
        }}
      />
    )
  }

  return (
    <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center shrink-0">
      <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">{initials}</span>
    </div>
  )
}

function parseOutscraperCSV(text: string): ImportRow[] {
  const lines = text.split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split('\t')

  const idx = {
    name:   headers.indexOf('author_title'),
    photo:  headers.indexOf('author_image'),
    text:   headers.indexOf('review_text'),
    rating: headers.indexOf('review_rating'),
    date:   headers.indexOf('review_datetime_utc'),
  }

  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const cols = line.split('\t')
      const rawText = cols[idx.text]?.replace(/<[^>]+>/g, ' ').trim() ?? ''
      if (!rawText) return null
      return {
        name:       cols[idx.name]?.trim() || 'Anonymous',
        quote:      rawText.slice(0, 1000),
        rating:     parseInt(cols[idx.rating]) || 5,
        photoUrl:   cols[idx.photo]?.trim() || '',
        reviewDate: cols[idx.date]?.slice(0, 10) || '',
        scope:      'global',
        source:     'gmb',
      }
    })
    .filter(Boolean) as ImportRow[]
}

const EMPTY_FORM = {
  name: '',
  jobTitle: '',
  company: '',
  quote: '',
  rating: 5,
  photoUrl: '',
  scope: 'global',
  courseSlug: '',
  visible: false,
  sortOrder: 0,
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */

export default function TestimonialsAdminPage() {
  const [tab, setTab] = useState<Tab>('all')

  /* Tab 1 state */
  const [items, setItems] = useState<Testimonial[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [scopeFilter, setScopeFilter] = useState('all')
  const [visibleFilter, setVisibleFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null)

  /* Tab 2 state */
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  /* Tab 3 state */
  const [parseResult, setParseResult] = useState<ImportRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  /* ── Fetch list ─────────────────────────────────────────────────────────── */

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (scopeFilter !== 'all') params.set('scope', scopeFilter)
      if (visibleFilter !== 'all') params.set('visible', visibleFilter)
      params.set('page', String(page))
      const res = await fetch(`/api/admin/testimonials?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setItems(data.items)
      setTotal(data.total)
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [search, scopeFilter, visibleFilter, page])

  useEffect(() => {
    if (tab === 'all') fetchItems()
  }, [tab, fetchItems])

  /* ── Toggle visible ──────────────────────────────────────────────────────── */

  async function toggleVisible(item: Testimonial) {
    await fetch(`/api/admin/testimonials/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !item.visible }),
    })
    fetchItems()
  }

  /* ── Delete ──────────────────────────────────────────────────────────────── */

  async function deleteItem(item: Testimonial) {
    if (!confirm(`Delete testimonial from "${item.name}"?`)) return
    await fetch(`/api/admin/testimonials/${item.id}`, { method: 'DELETE' })
    fetchItems()
  }

  /* ── Open edit ───────────────────────────────────────────────────────────── */

  function openEdit(item: Testimonial) {
    setEditingItem(item)
    setForm({
      name:       item.name,
      jobTitle:   item.jobTitle ?? '',
      company:    item.company ?? '',
      quote:      item.quote,
      rating:     item.rating,
      photoUrl:   item.photoUrl ?? '',
      scope:      item.scope,
      courseSlug: item.courseSlug ?? '',
      visible:    item.visible,
      sortOrder:  item.sortOrder,
    })
    setSaveError(null)
    setTab('add')
  }

  /* ── Submit form ─────────────────────────────────────────────────────────── */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      const payload = {
        ...form,
        rating:    Number(form.rating),
        sortOrder: Number(form.sortOrder),
        visible:   Boolean(form.visible),
        jobTitle:  form.jobTitle || null,
        company:   form.company || null,
        photoUrl:  form.photoUrl || null,
        courseSlug: form.scope === 'course' ? (form.courseSlug || null) : null,
      }

      const url = editingItem
        ? `/api/admin/testimonials/${editingItem.id}`
        : '/api/admin/testimonials'
      const method = editingItem ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Save failed')
      }

      setForm({ ...EMPTY_FORM })
      setEditingItem(null)
      setTab('all')
      fetchItems()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function cancelForm() {
    setForm({ ...EMPTY_FORM })
    setEditingItem(null)
    setSaveError(null)
    setTab('all')
  }

  /* ── File upload ─────────────────────────────────────────────────────────── */

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportMsg(null)

    if (file.name.endsWith('.xlsx')) {
      setImportMsg('XLSX files are not supported directly. Please export as CSV (TSV) from Outscraper and upload the .csv file.')
      setParseResult([])
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const rows = parseOutscraperCSV(text)
      setParseResult(rows)
      if (rows.length === 0) setImportMsg('No valid rows found. Make sure this is an Outscraper TSV/CSV export.')
    }
    reader.readAsText(file)
  }

  async function handleBulkImport() {
    if (parseResult.length === 0) return
    setImporting(true)
    setImportMsg(null)
    try {
      const res = await fetch('/api/admin/testimonials/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: parseResult }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')
      setImportMsg(`✓ Imported ${data.count} testimonials as hidden drafts.`)
      setParseResult([])
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  /* ── Stats ───────────────────────────────────────────────────────────────── */

  const visibleCount  = items.filter((i) => i.visible).length
  const globalCount   = items.filter((i) => i.scope === 'global').length
  const avgRating     = items.length
    ? (items.reduce((s, i) => s + i.rating, 0) / items.length).toFixed(1)
    : '—'

  const pages = Math.ceil(total / 20)

  /* ─── Render ─────────────────────────────────────────────────────────────── */

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Testimonials Manager</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Manage GMB reviews and manual testimonials shown across the site.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
        {([['all', 'All Testimonials'], ['add', editingItem ? 'Edit' : 'Add New'], ['import', 'Import CSV']] as [Tab, string][]).map(
          ([key, label]) => (
            <button
              key={key}
              onClick={() => {
                if (key !== 'add') { setEditingItem(null); setForm({ ...EMPTY_FORM }) }
                setTab(key)
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* ── TAB 1: ALL ─────────────────────────────────────────────────────── */}
      {tab === 'all' && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total', value: total },
              { label: 'Visible (this page)', value: visibleCount },
              { label: 'Global (this page)', value: globalCount },
              { label: 'Avg Rating (this page)', value: avgRating },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="text"
              placeholder="Search name, quote, course…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="flex-1 min-w-48 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            />
            <select
              value={scopeFilter}
              onChange={(e) => { setScopeFilter(e.target.value); setPage(1) }}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Scopes</option>
              <option value="global">Global</option>
              <option value="course">Course</option>
            </select>
            <select
              value={visibleFilter}
              onChange={(e) => { setVisibleFilter(e.target.value); setPage(1) }}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Visibility</option>
              <option value="true">Visible</option>
              <option value="false">Hidden</option>
            </select>
            <button
              onClick={() => setTab('add')}
              className="ml-auto rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              + Add New
            </button>
          </div>

          {/* Cards */}
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">No testimonials found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2 transition-opacity ${
                    item.visible ? '' : 'opacity-50'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <Avatar name={item.name} photoUrl={item.photoUrl} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.name}</p>
                        {!item.visible && (
                          <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded px-1.5 py-0.5">
                            Hidden
                          </span>
                        )}
                      </div>
                      {(item.jobTitle || item.company) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {[item.jobTitle, item.company].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <Stars value={item.rating} />
                    </div>
                  </div>

                  {/* Quote */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 flex-1">{item.quote}</p>

                  {/* Footer */}
                  <div className="flex items-center justify-between flex-wrap gap-2 mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 font-medium">
                        {item.scope === 'global' ? '🌐 Global' : `📘 ${item.courseSlug ?? 'course'}`}
                      </span>
                      {item.reviewDate && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">{item.reviewDate}</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleVisible(item)}
                        title={item.visible ? 'Hide' : 'Show'}
                        className="rounded px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {item.visible ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItem(item)}
                        className="rounded px-2 py-1 text-xs border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center gap-3 mt-6 justify-center">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {pages} ({total} total)
              </span>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: ADD / EDIT ──────────────────────────────────────────────── */}
      {tab === 'add' && (
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingItem ? `Edit — ${editingItem.name}` : 'Add Testimonial'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* jobTitle + company */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Data Scientist"
                  value={form.jobTitle}
                  onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                <input
                  type="text"
                  placeholder="e.g. TCS"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Quote */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quote <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={form.quote}
                onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 resize-y"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating</label>
              <Stars value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
            </div>

            {/* Scope */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scope</label>
              <select
                value={form.scope}
                onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              >
                <option value="global">Global (homepage)</option>
                <option value="course">Course-specific</option>
              </select>
            </div>

            {/* Course slug — only when scope=course */}
            {form.scope === 'course' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course slug <span className="text-xs text-gray-400">(e.g. python-programming)</span>
                </label>
                <input
                  type="text"
                  value={form.courseSlug}
                  onChange={(e) => setForm((f) => ({ ...f, courseSlug: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
            )}

            {/* Photo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Photo URL</label>
              <input
                type="url"
                placeholder="https://…"
                value={form.photoUrl}
                onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Visibility + sortOrder */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visibility</label>
                <select
                  value={form.visible ? 'true' : 'false'}
                  onChange={(e) => setForm((f) => ({ ...f, visible: e.target.value === 'true' }))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value="false">Hidden (draft)</option>
                  <option value="true">Visible</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {saveError && (
              <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : editingItem ? 'Save Changes' : 'Add Testimonial'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="rounded-md border border-gray-300 dark:border-gray-600 px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 3: IMPORT ──────────────────────────────────────────────────── */}
      {tab === 'import' && (
        <div className="max-w-3xl">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Import from Outscraper CSV</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Upload a tab-separated CSV exported from Outscraper (GMB reviews). All rows will be imported as
            <strong> hidden drafts</strong> — review and publish individually from the All tab.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Upload file (.csv / .tsv)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileChange}
              className="block text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-teal-50 dark:file:bg-teal-900/40 file:text-teal-700 dark:file:text-teal-400 hover:file:bg-teal-100 dark:hover:file:bg-teal-900/60 transition-colors"
            />
          </div>

          {importMsg && (
            <p className={`text-sm mb-4 ${importMsg.startsWith('✓') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {importMsg}
            </p>
          )}

          {parseResult.length > 0 && (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Preview — {parseResult.length} rows found:
              </p>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {['Name', 'Rating', 'Quote', 'Date'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {parseResult.slice(0, 20).map((row, i) => (
                      <tr key={i} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100 whitespace-nowrap">{row.name}</td>
                        <td className="px-3 py-2 text-yellow-500">{'★'.repeat(row.rating)}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-xs truncate">{row.quote}</td>
                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">{row.reviewDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parseResult.length > 20 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                    …and {parseResult.length - 20} more rows (showing first 20)
                  </p>
                )}
              </div>

              <button
                onClick={handleBulkImport}
                disabled={importing}
                className="rounded-md bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {importing ? 'Importing…' : `Import all ${parseResult.length} as drafts`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type ChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
type PageGroup = 'static' | 'landing' | 'category' | 'blog'

interface SitemapPage {
  slug:            string
  name:            string
  group:           PageGroup
  dbId:            string | null
  sitemapInclude:  boolean
  sitemapPriority: number
  changeFreq:      ChangeFreq
}

interface RobotRule {
  userAgent: string
  allow:     string[]
  disallow:  string[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CHANGE_FREQ_OPTIONS: ChangeFreq[] = [
  'always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never',
]

const DEFAULT_RULES: RobotRule[] = [
  { userAgent: '*',      allow: ['/'], disallow: ['/admin/', '/api/'] },
  { userAgent: 'GPTBot', allow: [],    disallow: ['/admin/', '/api/'] },
  { userAgent: 'CCBot',  allow: [],    disallow: ['/admin/', '/api/'] },
]

const GROUP_BADGE: Record<PageGroup, { label: string; cls: string }> = {
  static:   { label: 'Static',   cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  landing:  { label: 'Landing',  cls: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400' },
  category: { label: 'Category', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  blog:     { label: 'Blog',     cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function robotsPreviewFromRules(rules: RobotRule[]): string {
  return rules.map((r, i) => {
    const lines: string[] = []
    if (i > 0) lines.push('')
    lines.push(`User-agent: ${r.userAgent}`)
    r.allow.forEach(p => lines.push(`Allow: ${p}`))
    r.disallow.forEach(p => lines.push(`Disallow: ${p}`))
    return lines.join('\n')
  }).join('\n')
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SitemapManagerPage() {
  const [activeTab, setActiveTab] = useState<'sitemap' | 'robots'>('sitemap')

  // ── Tab 1 state ────────────────────────────────────────────────────────────
  const [pages, setPages]               = useState<SitemapPage[]>([])
  const [loading, setLoading]           = useState(true)
  const [groupFilter, setGroupFilter]   = useState<PageGroup | 'all'>('all')
  const [search, setSearch]             = useState('')
  const [previewXml, setPreviewXml]     = useState('')
  const [previewCount, setPreviewCount] = useState(0)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [saving, setSaving]             = useState<string | null>(null)
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // ── Tab 2 state ────────────────────────────────────────────────────────────
  const [rules, setRules]             = useState<RobotRule[]>(DEFAULT_RULES)
  const [savingRobots, setSavingRobots] = useState(false)
  const [robotsSaved, setRobotsSaved] = useState(false)

  // ── Load sitemap pages ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/sitemap/pages')
      .then(r => r.json())
      .then((data: SitemapPage[]) => {
        setPages(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // ── Load robots on tab switch ──────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'robots') return
    fetch('/api/admin/sitemap/robots')
      .then(r => r.json())
      .then(data => {
        // Parse rules from the preview text returned by the server
        // We keep the client-side rules as the source of truth for editing
        // so only seed if we haven't edited yet
        if (data.preview) {
          const parsed = parseRobotsPreview(data.preview)
          if (parsed.length > 0) setRules(parsed)
        }
      })
      .catch(() => {/* keep defaults */})
  }, [activeTab])

  // ── Update a single page field (debounced) ─────────────────────────────────
  const updatePage = useCallback((slug: string, field: keyof SitemapPage, value: unknown) => {
    setPages(prev => prev.map(p => p.slug === slug ? { ...p, [field]: value } : p))

    clearTimeout(saveTimers.current[slug])
    saveTimers.current[slug] = setTimeout(async () => {
      setSaving(slug)
      try {
        await fetch(`/api/admin/sitemap/pages/${encodeURIComponent(slug)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
        })
      } finally {
        setSaving(null)
      }
    }, 800)
  }, [])

  // ── Preview sitemap ────────────────────────────────────────────────────────
  async function previewSitemap() {
    setLoadingPreview(true)
    try {
      const res = await fetch('/api/admin/sitemap/preview')
      const data = await res.json()
      setPreviewXml(data.xml ?? '')
      setPreviewCount(data.count ?? 0)
    } finally {
      setLoadingPreview(false)
    }
  }

  // ── Save robots ────────────────────────────────────────────────────────────
  async function saveRobots() {
    setSavingRobots(true)
    try {
      await fetch('/api/admin/sitemap/robots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      })
      setRobotsSaved(true)
      setTimeout(() => setRobotsSaved(false), 2000)
    } finally {
      setSavingRobots(false)
    }
  }

  // ── Filtered pages ─────────────────────────────────────────────────────────
  const filteredPages = pages.filter(p => {
    if (groupFilter !== 'all' && p.group !== groupFilter) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalIncluded = pages.filter(p => p.sitemapInclude).length
  const totalExcluded = pages.filter(p => !p.sitemapInclude).length
  const avgPriority   = pages.length
    ? (pages.reduce((s, p) => s + p.sitemapPriority, 0) / pages.length).toFixed(2)
    : '—'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sitemap &amp; Robots Manager</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Control which pages appear in sitemap.xml and configure robots.txt rules.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-6">
          {(['sitemap', 'robots'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'pb-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              ].join(' ')}
            >
              {tab === 'sitemap' ? 'Sitemap Control' : 'Robots.txt Editor'}
            </button>
          ))}
        </nav>
      </div>

      {/* ── TAB 1: Sitemap ── */}
      {activeTab === 'sitemap' && (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="Pages in sitemap" value={String(totalIncluded)} />
            <StatCard label="Excluded pages"   value={String(totalExcluded)} highlight={totalExcluded > 0} />
            <StatCard label="Avg priority"     value={avgPriority} />
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              placeholder="Search pages…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 w-56"
            />
            <div className="flex gap-1">
              {(['all', 'static', 'landing', 'category'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setGroupFilter(g)}
                  className={[
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    groupFilter === g
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
                  ].join(' ')}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide w-[40%]">Page</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Group</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Include</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide w-44">Priority</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Change Freq</th>
                    <th className="px-3 py-3 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 bg-white dark:bg-gray-900">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">Loading pages…</td>
                    </tr>
                  ) : filteredPages.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No pages match the current filter.</td>
                    </tr>
                  ) : (
                    filteredPages.map(page => {
                      const badge = GROUP_BADGE[page.group]
                      const isSavingThis = saving === page.slug
                      return (
                        <tr
                          key={page.slug}
                          className={[
                            'transition-colors',
                            !page.sitemapInclude ? 'opacity-50' : '',
                          ].join(' ')}
                        >
                          {/* Page name */}
                          <td className="px-4 py-2.5">
                            <span className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">{page.name}</span>
                          </td>

                          {/* Group badge */}
                          <td className="px-3 py-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </td>

                          {/* Include toggle */}
                          <td className="px-3 py-2.5 text-center">
                            <button
                              role="switch"
                              aria-checked={page.sitemapInclude}
                              onClick={() => updatePage(page.slug, 'sitemapInclude', !page.sitemapInclude)}
                              className={[
                                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500',
                                page.sitemapInclude ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600',
                              ].join(' ')}
                            >
                              <span
                                className={[
                                  'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                                  page.sitemapInclude ? 'translate-x-4' : 'translate-x-0.5',
                                ].join(' ')}
                              />
                            </button>
                          </td>

                          {/* Priority slider */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="0.1"
                                max="1.0"
                                step="0.1"
                                value={page.sitemapPriority}
                                onChange={e => updatePage(page.slug, 'sitemapPriority', parseFloat(e.target.value))}
                                className="w-24 accent-teal-600"
                              />
                              <span className="text-xs text-gray-600 dark:text-gray-400 w-6 tabular-nums">
                                {page.sitemapPriority.toFixed(1)}
                              </span>
                            </div>
                          </td>

                          {/* Change freq dropdown */}
                          <td className="px-3 py-2.5">
                            <select
                              value={page.changeFreq}
                              onChange={e => updatePage(page.slug, 'changeFreq', e.target.value as ChangeFreq)}
                              className="h-7 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            >
                              {CHANGE_FREQ_OPTIONS.map(f => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </td>

                          {/* Saving indicator */}
                          <td className="px-2 py-2.5">
                            {isSavingThis && (
                              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions row */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={previewSitemap}
              disabled={loadingPreview}
              className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
            >
              {loadingPreview ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : null}
              {loadingPreview ? 'Generating…' : 'Preview Sitemap'}
            </button>

            <a
              href="https://search.google.com/search-console/sitemaps?resource_id=https://www.cosscloudsol.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Submit to Search Console ↗
            </a>
          </div>

          {/* Preview pane */}
          {previewXml && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Preview — <span className="font-medium text-teal-600 dark:text-teal-400">{previewCount} URLs</span>
              </p>
              <textarea
                readOnly
                value={previewXml}
                rows={20}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300 focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Robots ── */}
      {activeTab === 'robots' && (
        <div className="space-y-5">
          {/* Info banner */}
          <div className="rounded-lg border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            Changes to robots.ts take effect after Vercel redeploys.
            Use the <strong>Redirects Manager → Sync &amp; Deploy</strong> button to trigger a deploy.
          </div>

          {/* Rule cards */}
          <div className="space-y-3">
            {rules.map((rule, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rule #{i + 1}</span>
                  <button
                    onClick={() => setRules(prev => prev.filter((_, j) => j !== i))}
                    className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 hover:underline"
                  >
                    Delete rule
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">User Agent</label>
                    <input
                      type="text"
                      value={rule.userAgent}
                      onChange={e => setRules(prev => prev.map((r, j) => j === i ? { ...r, userAgent: e.target.value } : r))}
                      className="w-full h-8 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Allow paths (comma-separated)</label>
                    <input
                      type="text"
                      value={rule.allow.join(', ')}
                      onChange={e => setRules(prev => prev.map((r, j) =>
                        j === i ? { ...r, allow: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : r
                      ))}
                      className="w-full h-8 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      placeholder="/, /public/"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Disallow paths (comma-separated)</label>
                    <input
                      type="text"
                      value={rule.disallow.join(', ')}
                      onChange={e => setRules(prev => prev.map((r, j) =>
                        j === i ? { ...r, disallow: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : r
                      ))}
                      className="w-full h-8 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      placeholder="/admin/, /api/"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add rule */}
          <button
            onClick={() => setRules(prev => [...prev, { userAgent: '', allow: [], disallow: [] }])}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:border-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            + Add rule
          </button>

          {/* Live preview */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview (robots.txt format)</p>
            <pre className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {robotsPreviewFromRules(rules) || '# No rules defined'}
            </pre>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={saveRobots}
              disabled={savingRobots}
              className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
            >
              {savingRobots ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : null}
              {robotsSaved ? 'Saved ✓' : savingRobots ? 'Saving…' : 'Save robots.ts'}
            </button>

            <button
              onClick={() => setRules(DEFAULT_RULES)}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${highlight ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </p>
    </div>
  )
}

// ── robots.txt preview parser ─────────────────────────────────────────────────

function parseRobotsPreview(preview: string): RobotRule[] {
  const rules: RobotRule[] = []
  let current: RobotRule | null = null

  for (const rawLine of preview.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    if (line.startsWith('User-agent:')) {
      current = { userAgent: line.replace('User-agent:', '').trim(), allow: [], disallow: [] }
      rules.push(current)
    } else if (line.startsWith('Allow:') && current) {
      current.allow.push(line.replace('Allow:', '').trim())
    } else if (line.startsWith('Disallow:') && current) {
      current.disallow.push(line.replace('Disallow:', '').trim())
    }
  }

  return rules
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────
interface CloudinaryAsset {
  public_id:     string
  format:        string
  resource_type: string
  bytes:         number
  width?:        number
  height?:       number
  secure_url:    string
  created_at:    string
}

interface KeyAssets {
  ogImageUrl?:      string
  logoUrl?:         string
  logoLightUrl?:    string
  faviconUrl?:      string
  appleTouchUrl?:   string
  courseOgDefault?: string
  updatedAt?:       string
}

interface ScanItem {
  url:         string
  page:        string
  status:      'broken' | 'slow' | 'redirect'
  statusCode?: number
  responseMs?: number
}

interface ScanResult {
  id:            string
  scannedAt:     string
  totalImages:   number
  brokenCount:   number
  slowCount:     number
  redirectCount: number
  results:       ScanItem[]
}

// ── Helpers ────────────────────────────────────────────────────
function fmtBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// Build DELETE URL — split publicId on slashes so catch-all route captures each segment
function assetDeleteUrl(publicId: string): string {
  const encoded = publicId.split('/').map(encodeURIComponent).join('/')
  return `/api/admin/media/assets/${encoded}`
}

// ── Slot definitions ───────────────────────────────────────────
const KEY_ASSET_SLOTS = [
  {
    key:         'ogImageUrl' as const,
    label:       'OG / social image',
    desc:        '1200×630px · shown on WhatsApp / LinkedIn shares',
    recommended: '1200×630',
  },
  {
    key:         'logoUrl' as const,
    label:       'Site logo (dark)',
    desc:        'SVG or PNG · used on light backgrounds (navbar)',
    recommended: 'SVG or PNG',
  },
  {
    key:         'logoLightUrl' as const,
    label:       'Site logo (light)',
    desc:        'SVG or PNG · used on dark backgrounds (footer)',
    recommended: 'SVG or PNG',
  },
  {
    key:         'faviconUrl' as const,
    label:       'Favicon',
    desc:        '32×32px .ico or .png · browser tab icon',
    recommended: '32×32',
  },
  {
    key:         'appleTouchUrl' as const,
    label:       'Apple touch icon',
    desc:        '180×180px · iOS home screen shortcut',
    recommended: '180×180',
  },
  {
    key:         'courseOgDefault' as const,
    label:       'Default course banner',
    desc:        '1200×630px · fallback OG for courses without a custom banner',
    recommended: '1200×630',
  },
]

// ── Main component ─────────────────────────────────────────────
export default function MediaManagerPage() {
  const [activeTab, setActiveTab] = useState<'browser' | 'keyassets' | 'scanner'>('browser')

  // ─ Browser state ─
  const [assets, setAssets]               = useState<CloudinaryAsset[]>([])
  const [cursor, setCursor]               = useState<string | null>(null)
  const [hasMore, setHasMore]             = useState(true)
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [search, setSearch]               = useState('')
  const [typeFilter, setTypeFilter]       = useState('image')
  const [copiedId, setCopiedId]           = useState<string | null>(null)
  const [deletingId, setDeletingId]       = useState<string | null>(null)

  // ─ Key assets state ─
  const [keyAssets, setKeyAssets]       = useState<KeyAssets>({})
  const [loadingSlot, setLoadingSlot]   = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const sentinelRef = useRef<HTMLDivElement>(null)

  // ─ Scanner state ─
  const [scanResult, setScanResult]   = useState<ScanResult | null>(null)
  const [scanning, setScanning]       = useState(false)
  const [scanFilter, setScanFilter]   = useState<'all' | 'broken' | 'slow' | 'redirect'>('all')

  // ── Fetch assets ───────────────────────────────────────────
  const fetchAssets = useCallback(async (reset = false) => {
    setLoadingAssets(true)
    const params = new URLSearchParams({ type: typeFilter })
    if (!reset && cursor) params.set('cursor', cursor)
    if (search) params.set('prefix', search)

    try {
      const res  = await fetch(`/api/admin/media/assets?${params}`)
      const data = await res.json()
      const newAssets: CloudinaryAsset[] = data.resources ?? []

      setAssets(prev => reset ? newAssets : [...prev, ...newAssets])
      setCursor(data.next_cursor ?? null)
      setHasMore(!!data.next_cursor)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAssets(false)
    }
  }, [typeFilter, search, cursor])

  useEffect(() => {
    if (activeTab === 'browser') {
      setAssets([])
      setCursor(null)
      setHasMore(true)
      fetchAssets(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, typeFilter])

  // ── Copy URL ───────────────────────────────────────────────
  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ── Delete asset ───────────────────────────────────────────
  const handleDeleteAsset = async (publicId: string) => {
    if (!confirm(`Delete "${publicId}"? This cannot be undone.`)) return
    setDeletingId(publicId)
    try {
      const res = await fetch(assetDeleteUrl(publicId), { method: 'DELETE' })
      if (res.ok) {
        setAssets(prev => prev.filter(a => a.public_id !== publicId))
      } else {
        alert('Delete failed')
      }
    } catch {
      alert('Network error')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Fetch key assets ───────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'keyassets') {
      fetch('/api/admin/media/key-assets')
        .then(r => r.json())
        .then(setKeyAssets)
        .catch(console.error)
    }
  }, [activeTab])

  // ── Upload key asset ───────────────────────────────────────
  const uploadKeyAsset = async (slot: string, file: File) => {
    setLoadingSlot(slot)
    const form = new FormData()
    form.append('slot', slot)
    form.append('file', file)

    try {
      const res  = await fetch('/api/admin/media/key-assets', { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok && data.url) {
        setKeyAssets(prev => ({ ...prev, [slot]: data.url }))
      } else {
        alert(data.error ?? 'Upload failed')
      }
    } catch {
      alert('Network error')
    } finally {
      setLoadingSlot(null)
    }
  }

  // ── Fetch scan ─────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'scanner') {
      fetch('/api/admin/media/scan')
        .then(r => r.json())
        .then(setScanResult)
        .catch(console.error)
    }
  }, [activeTab])

  // ── Infinite scroll via IntersectionObserver ──────────────
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || activeTab !== 'browser') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingAssets) {
          fetchAssets(false)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingAssets, fetchAssets, activeTab])

  // ── Run manual scan ────────────────────────────────────────
  const triggerScan = async () => {
    if (!confirm('This may take 2–5 minutes depending on site size. Continue?')) return
    setScanning(true)
    try {
      const res  = await fetch('/api/admin/media/scan', { method: 'POST' })
      const data = await res.json()
      if (res.ok) setScanResult(data)
      else alert(data.error ?? 'Scan failed')
    } catch {
      alert('Network error')
    } finally {
      setScanning(false)
    }
  }

  // ── Export CSV ─────────────────────────────────────────────
  const exportCsv = () => {
    if (!scanResult) return
    const rows = [
      ['URL', 'Found On Page', 'Status', 'HTTP Code', 'Response ms'],
      ...(scanResult.results as ScanItem[]).map(r => [
        r.url, r.page, r.status, String(r.statusCode ?? ''), String(r.responseMs ?? ''),
      ]),
    ]
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href     = URL.createObjectURL(blob)
    link.download = `media-scan-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  // ── Filtered scan results ──────────────────────────────────
  const filteredResults = scanResult
    ? (scanResult.results as ScanItem[]).filter(
        r => scanFilter === 'all' || r.status === scanFilter
      )
    : []

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#0f172a] dark:text-gray-100">Media Manager</h1>
          <p className="text-sm text-[#475569] dark:text-gray-400 mt-1">
            Cloudinary assets · key site images · broken URL scanner
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#e2e8f0] dark:border-white/10">
        {([
          { id: 'browser',   label: 'Asset browser' },
          { id: 'keyassets', label: 'Key assets' },
          { id: 'scanner',   label: 'Dead URL scanner' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#024c57] text-[#024c57] dark:border-teal-400 dark:text-teal-400 bg-transparent'
                : 'border-transparent text-[#475569] dark:text-gray-400 hover:text-[#0f172a] dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ TAB 1: Asset Browser ══════════════════════════════ */}
      {activeTab === 'browser' && (
        <div>
          {/* Toolbar */}
          <div className="flex gap-3 mb-5">
            <input
              type="text"
              placeholder="Search by folder or filename prefix…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchAssets(true)}
              className="flex-1 bg-white dark:bg-gray-800 border border-[#c9e8ed] dark:border-white/10 rounded-lg px-3 py-2 text-sm text-[#0f172a] dark:text-gray-100 placeholder:text-[#94a3b8] dark:placeholder-gray-500"
            />
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setAssets([]); setCursor(null) }}
              className="bg-white dark:bg-gray-800 border border-[#c9e8ed] dark:border-white/10 rounded-lg px-3 py-2 text-sm text-[#0f172a] dark:text-gray-100"
            >
              <option value="image">Images</option>
              <option value="raw">PDFs / files</option>
            </select>
            <button
              onClick={() => fetchAssets(true)}
              className="px-4 py-2 bg-[#024c57] text-white text-sm rounded-lg hover:bg-[#03798a] transition-colors"
            >
              Search
            </button>
          </div>

          {/* Grid */}
          {assets.length === 0 && !loadingAssets ? (
            <div className="text-center py-16 text-[#94a3b8] dark:text-gray-500 text-sm">
              No assets found. Try a different search or filter.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-5">
              {assets.map(asset => (
                <div
                  key={asset.public_id}
                  className="group relative border border-[#c9e8ed] dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-gray-800"
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-[#f1f5f9] dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {asset.resource_type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.secure_url}
                        alt={asset.public_id}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[#94a3b8] dark:text-gray-400 text-xs text-center px-2 break-all">
                        {asset.format.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => copyUrl(asset.secure_url, asset.public_id)}
                      className="px-2 py-1 text-xs bg-[#024c57] hover:bg-[#03798a] text-white rounded transition-colors"
                    >
                      {copiedId === asset.public_id ? 'Copied!' : 'Copy URL'}
                    </button>
                    <button
                      onClick={() => handleDeleteAsset(asset.public_id)}
                      disabled={deletingId === asset.public_id}
                      className="px-2 py-1 text-xs bg-[#dc2626] hover:bg-red-700 text-white rounded disabled:opacity-50 transition-colors"
                    >
                      {deletingId === asset.public_id ? '…' : 'Delete'}
                    </button>
                  </div>

                  {/* Meta */}
                  <div className="p-2 border-t border-[#e2e8f0] dark:border-white/10">
                    <p className="text-xs text-[#0f172a] dark:text-gray-200 truncate" title={asset.public_id}>
                      {asset.public_id.split('/').pop()}
                    </p>
                    <p className="text-xs text-[#94a3b8] dark:text-gray-500 mt-0.5">
                      {asset.width && asset.height
                        ? `${asset.width}×${asset.height} · `
                        : ''}
                      {fmtBytes(asset.bytes)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Loading placeholders */}
              {loadingAssets &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-[#f1f5f9] dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />
          {loadingAssets && assets.length > 0 && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-[#024c57] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!hasMore && assets.length > 0 && (
            <p className="text-center text-xs text-[#94a3b8] dark:text-[#8b949e] py-3">All images loaded</p>
          )}
        </div>
      )}

      {/* ══ TAB 2: Key Assets ════════════════════════════════ */}
      {activeTab === 'keyassets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {KEY_ASSET_SLOTS.map(slot => {
            const currentUrl = keyAssets[slot.key]
            const isSet      = !!currentUrl
            const isLoading  = loadingSlot === slot.key

            return (
              <div key={slot.key} className="bg-white dark:bg-gray-800 border border-[#c9e8ed] dark:border-white/10 rounded-xl p-3">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-[#0f172a] dark:text-gray-100">{slot.label}</p>
                    <p className="text-xs text-[#94a3b8] dark:text-gray-500 mt-1">{slot.desc}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-md whitespace-nowrap ml-3 ${
                      isSet
                        ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400'
                        : 'bg-amber-50 dark:bg-yellow-500/10 text-amber-700 dark:text-yellow-400'
                    }`}
                  >
                    {isSet ? '✓ Set' : '⚠ Missing'}
                  </span>
                </div>

                {/* Preview */}
                <div className="w-full h-24 bg-[#f1f5f9] dark:bg-gray-700 rounded-lg flex items-center justify-center mb-3 overflow-hidden border border-[#e2e8f0] dark:border-white/5">
                  {currentUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUrl}
                      alt={slot.label}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-[#94a3b8] dark:text-gray-600 text-xs">{slot.recommended}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRefs.current[slot.key]?.click()}
                    disabled={isLoading}
                    className="flex-1 py-1.5 text-xs bg-[#e6f4f6] dark:bg-teal-500/10 text-[#024c57] dark:text-teal-400 border border-[#c9e8ed] dark:border-teal-500/20 rounded-lg hover:bg-[#c9e8ed] dark:hover:bg-teal-500/20 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Uploading…' : isSet ? 'Replace' : 'Upload'}
                  </button>
                  {currentUrl && (
                    <button
                      onClick={() => copyUrl(currentUrl, slot.key)}
                      className="px-3 py-1.5 text-xs bg-[#f1f5f9] dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-[#475569] dark:text-gray-300 rounded-lg border border-[#e2e8f0] dark:border-white/10"
                    >
                      {copiedId === slot.key ? 'Copied!' : 'Copy URL'}
                    </button>
                  )}
                  {currentUrl && (
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs bg-[#f1f5f9] dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-[#475569] dark:text-gray-300 rounded-lg border border-[#e2e8f0] dark:border-white/10"
                    >
                      Preview
                    </a>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={el => { fileInputRefs.current[slot.key] = el }}
                  type="file"
                  accept="image/*,.ico,.svg"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) uploadKeyAsset(slot.key, file)
                    e.target.value = ''
                  }}
                />

                {/* Last updated */}
                {keyAssets.updatedAt && isSet && (
                  <p className="text-xs text-[#94a3b8] dark:text-gray-600 mt-2">
                    Last updated {fmtDate(keyAssets.updatedAt)}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ══ TAB 3: Dead URL Scanner ═══════════════════════════ */}
      {activeTab === 'scanner' && (
        <div>
          {/* Scanner control card */}
          <div className="border border-[#e2e8f0] dark:border-white/10 rounded-xl p-5 bg-white dark:bg-gray-800 mb-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-11 h-11 rounded-lg bg-[#f1f5f9] dark:bg-gray-700 flex items-center justify-center text-[#94a3b8] dark:text-gray-400 flex-shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#0f172a] dark:text-gray-100">Image URL scanner</p>
                <p className="text-xs text-[#94a3b8] dark:text-gray-500 mt-0.5">
                  Quick scan checks static + landing pages (~44 pages). Full scan runs automatically every night at midnight IST.
                </p>
              </div>
              <button
                onClick={triggerScan}
                disabled={scanning}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
                style={{ background: '#023340' }}
              >
                {scanning ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Scanning…
                  </>
                ) : (
                  'Run scan now'
                )}
              </button>
            </div>

            {scanResult ? (
              <>
                <p className="text-xs text-[#94a3b8] dark:text-gray-500 mb-4">
                  Last scan: {fmtDate(scanResult.scannedAt)} · {scanResult.totalImages} images checked
                </p>
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Working',      val: scanResult.totalImages - scanResult.brokenCount - scanResult.slowCount - scanResult.redirectCount, color: 'text-teal-600 dark:text-teal-400' },
                    { label: 'Broken (404)', val: scanResult.brokenCount,   color: 'text-red-600 dark:text-red-400' },
                    { label: 'Slow (>2s)',   val: scanResult.slowCount,     color: 'text-amber-600 dark:text-yellow-400' },
                    { label: 'Redirecting',  val: scanResult.redirectCount, color: 'text-[#475569] dark:text-gray-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-[#f1f5f9] dark:bg-gray-700 rounded-lg p-3">
                      <p className={`text-xl font-semibold ${s.color}`}>{s.val}</p>
                      <p className="text-xs text-[#94a3b8] dark:text-gray-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-[#94a3b8] dark:text-gray-500">No scan results yet. Run the first scan above.</p>
            )}
          </div>

          {/* Results table */}
          {scanResult && (scanResult.results as ScanItem[]).length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2">
                  {(['all', 'broken', 'slow', 'redirect'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setScanFilter(f)}
                      className={`px-3 py-1 text-xs rounded-md ${
                        scanFilter === f
                          ? 'bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30'
                          : 'bg-[#f1f5f9] dark:bg-gray-700 text-[#475569] dark:text-gray-400 border border-[#e2e8f0] dark:border-white/10 hover:text-[#0f172a] dark:hover:text-gray-200'
                      }`}
                    >
                      {f === 'all' ? 'All issues' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={exportCsv}
                  className="px-3 py-1.5 text-xs bg-[#f1f5f9] dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-[#475569] dark:text-gray-300 rounded-lg border border-[#e2e8f0] dark:border-white/10 flex items-center gap-1.5"
                >
                  Export CSV
                </button>
              </div>

              <div className="border border-[#e2e8f0] dark:border-white/10 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[2fr_1fr_80px] px-4 py-2.5 bg-[#f8fafc] dark:bg-gray-800 border-b border-[#e2e8f0] dark:border-white/10">
                  <span className="text-xs text-[#94a3b8] dark:text-gray-500 uppercase tracking-wide">Broken URL</span>
                  <span className="text-xs text-[#94a3b8] dark:text-gray-500 uppercase tracking-wide">Found on page</span>
                  <span className="text-xs text-[#94a3b8] dark:text-gray-500 uppercase tracking-wide text-right">Status</span>
                </div>

                {filteredResults.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-[#94a3b8] dark:text-gray-500 text-center bg-white dark:bg-gray-900">
                    No {scanFilter} issues found.
                  </div>
                ) : (
                  filteredResults.map((item, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[2fr_1fr_80px] px-4 py-3 bg-white dark:bg-gray-900 border-b border-[#f1f5f9] dark:border-white/5 last:border-0 items-center"
                    >
                      <p className="text-xs text-red-600 dark:text-red-400 truncate pr-4" title={item.url}>
                        {item.url.replace('https://www.cosscloudsol.com', '')}
                      </p>
                      <p className="text-xs text-[#94a3b8] dark:text-gray-500 truncate pr-4">{item.page}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded text-right justify-self-end ${
                          item.status === 'broken'
                            ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                            : item.status === 'slow'
                              ? 'bg-amber-50 dark:bg-yellow-500/10 text-amber-600 dark:text-yellow-400'
                              : 'bg-[#f1f5f9] dark:bg-gray-700 text-[#475569] dark:text-gray-400'
                        }`}
                      >
                        {item.status === 'broken'
                          ? `${item.statusCode ?? 0}`
                          : item.status === 'slow'
                            ? `${item.responseMs}ms`
                            : `→ ${item.statusCode}`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

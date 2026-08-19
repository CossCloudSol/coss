'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { publicIdFromUrl } from '@/lib/cloudinary'

// ── Shared types ───────────────────────────────────────────────
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

const BROWSE_PREFIX = 'cosscloudsol/site-images'

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Strips a trailing WordPress size token (-768x512), a trailing random
// 10-hex upload suffix (-c32ee591d0), or a trailing duplicated-extension
// word (-jpg) — repeatedly, since a filename can carry more than one — then
// lowercases. Unifies both the clean upload tree and the parallel
// wp-content mirror tree down to one key per source image.
function normalizeBaseName(publicId: string): string {
  const filename = publicId.split('/').pop() ?? publicId
  let s = filename
  let changed = true
  while (changed) {
    changed = false
    const stripped = s
      .replace(/-\d{2,5}x\d{2,5}$/i, '')
      .replace(/-[0-9a-f]{10}$/i, '')
      .replace(/-(jpg|jpeg|png|webp|gif)$/i, '')
    if (stripped !== s) {
      s = stripped
      changed = true
    }
  }
  return s.toLowerCase()
}

// Collapses WordPress-migration size variants down to one tile per source
// image, keeping the variant with the largest actual pixel area (never
// parsed from the filename — Cloudinary's own width/height is ground truth).
//
// Dedupe runs per fetched page only: a variant of the same image landing on
// a different page won't be merged with this one. Known limitation, not a
// bug — catching cross-page duplicates would mean re-scanning the full
// result set (up to ~1000 assets) on every page load just to dedupe.
function dedupePage(assets: CloudinaryAsset[]): CloudinaryAsset[] {
  const bestByKey = new Map<string, CloudinaryAsset>()
  for (const asset of assets) {
    const key = normalizeBaseName(asset.public_id)
    const existing = bestByKey.get(key)
    const area = (asset.width ?? 0) * (asset.height ?? 0)
    const existingArea = existing ? (existing.width ?? 0) * (existing.height ?? 0) : -1
    if (!existing || area > existingArea) bestByKey.set(key, asset)
  }
  return [...bestByKey.values()]
}

// ── Browse tab ─────────────────────────────────────────────────
function BrowseTab({ onSelect }: { onSelect: (url: string) => void }) {
  const [assets, setAssets]     = useState<CloudinaryAsset[]>([])
  const [cursor, setCursor]     = useState<string | null>(null)
  const [hasMore, setHasMore]   = useState(true)
  const [loading, setLoading]   = useState(false)
  const [search, setSearch]     = useState('')
  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchPage = useCallback(async (reset: boolean) => {
    setLoading(true)
    const params = new URLSearchParams({ type: 'image', prefix: BROWSE_PREFIX })
    if (!reset && cursor) params.set('cursor', cursor)

    try {
      const res  = await fetch(`/api/admin/media/assets?${params}`)
      const data = await res.json()
      const page = dedupePage(data.resources ?? [])

      setAssets(prev => reset ? page : [...prev, ...page])
      setCursor(data.next_cursor ?? null)
      setHasMore(!!data.next_cursor)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor])

  // Mount-time load — this tab unmounts when the user switches away, so a
  // fresh mount is the reset point (mirrors admin/media/page.tsx's
  // activeTab-triggered reset).
  useEffect(() => {
    fetchPage(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) fetchPage(false)
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, fetchPage])

  const filtered = search
    ? assets.filter(a => a.public_id.toLowerCase().includes(search.toLowerCase()))
    : assets

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Filter loaded images by filename…"
        className="w-full mb-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />

      {filtered.length === 0 && !loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
          No images found.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {filtered.map(asset => (
            <button
              key={asset.public_id}
              type="button"
              onClick={() => onSelect(asset.secure_url)}
              className="group text-left border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden hover:border-teal-500 dark:hover:border-teal-400 transition-colors"
            >
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.secure_url}
                  alt={asset.public_id}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-1.5">
                <p className="text-[11px] text-gray-700 dark:text-gray-300 truncate" title={asset.public_id}>
                  {asset.public_id.split('/').pop()}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  {asset.width && asset.height ? `${asset.width}×${asset.height}` : '— × —'} · {fmtBytes(asset.bytes)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {!hasMore && assets.length > 0 && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-3">All images loaded</p>
      )}
    </div>
  )
}

// ── Upload tab ─────────────────────────────────────────────────
function UploadTab({ onSelect }: { onSelect: (url: string) => void }) {
  const [file, setFile]           = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [error, setError]         = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = () => {
    if (!file) return
    setUploading(true)
    setProgress(0)
    setError(null)

    const form = new FormData()
    form.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/media/assets')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      setUploading(false)
      let data: { secureUrl?: string; error?: string } = {}
      try { data = JSON.parse(xhr.responseText) } catch { /* non-JSON response */ }

      if (xhr.status >= 200 && xhr.status < 300 && data.secureUrl) {
        onSelect(data.secureUrl)
      } else {
        setError(data.error ?? `Upload failed (HTTP ${xhr.status})`)
      }
    }
    xhr.onerror = () => {
      setUploading(false)
      setError('Network error during upload')
    }
    xhr.send(form)
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={e => {
          setFile(e.target.files?.[0] ?? null)
          setError(null)
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2.5 text-sm rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 disabled:opacity-50 transition-colors"
      >
        {file ? file.name : 'Choose a file…'}
      </button>

      {file && (
        <button
          type="button"
          onClick={upload}
          disabled={uploading}
          className="px-4 py-2 text-sm rounded-lg bg-[#024c57] text-white hover:bg-[#03798a] disabled:opacity-50 transition-colors"
        >
          {uploading ? `Uploading… ${progress}%` : 'Upload'}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center max-w-sm">{error}</p>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-sm">
        JPEG, PNG, WEBP, or GIF. Max 4 MB.
      </p>
    </div>
  )
}

// ── Paste tab ──────────────────────────────────────────────────
function PasteTab({ onSelect }: { onSelect: (url: string) => void }) {
  const [url, setUrl] = useState('')

  const trimmed        = url.trim()
  const looksLikeUrl    = trimmed.startsWith('http')
  const isCloudinaryUrl = looksLikeUrl && publicIdFromUrl(trimmed) !== null
  const showWarning     = looksLikeUrl && !isCloudinaryUrl

  const submit = () => {
    if (trimmed) onSelect(trimmed)
  }

  return (
    <div className="py-6">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Image URL</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="https://…"
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!trimmed}
          className="px-4 py-2 text-sm rounded-lg bg-[#024c57] text-white hover:bg-[#03798a] disabled:opacity-50 transition-colors flex-shrink-0"
        >
          Use this URL
        </button>
      </div>
      {showWarning && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
          This doesn&apos;t look like a Cloudinary URL — automatic format/resizing transformations won&apos;t apply. It will still be used as-is.
        </p>
      )}
    </div>
  )
}

// ── Modal shell ────────────────────────────────────────────────
function PickerModal({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState<'browse' | 'upload' | 'paste'>('browse')

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-10"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-gray-800 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Choose an image</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-3 border-b border-gray-200 dark:border-gray-700">
          {([
            { id: 'browse' as const, label: 'Browse' },
            { id: 'upload' as const, label: 'Upload' },
            { id: 'paste'  as const, label: 'Paste URL' },
          ]).map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {tab === 'browse' && <BrowseTab onSelect={onSelect} />}
          {tab === 'upload' && <UploadTab onSelect={onSelect} />}
          {tab === 'paste'  && <PasteTab onSelect={onSelect} />}
        </div>
      </div>
    </div>
  )
}

// ── Public component ───────────────────────────────────────────
interface ImagePickerProps {
  value:    string
  onChange: (url: string) => void
}

export function ImagePicker({ value, onChange }: ImagePickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (url: string) => {
    onChange(url)
    setOpen(false)
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 flex-shrink-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 dark:text-gray-500">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={value}>
            {value || 'No image selected'}
          </p>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-xs px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20 hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors"
            >
              {value ? 'Change' : 'Choose image'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {open && <PickerModal onSelect={handleSelect} onClose={() => setOpen(false)} />}
    </div>
  )
}

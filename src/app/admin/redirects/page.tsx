'use client'

import { useState, useEffect } from 'react'

interface Redirect {
  id: string
  source: string
  destination: string
  statusCode: number
  isActive: boolean
  createdAt: string
}

interface CsvRow {
  source: string
  destination: string
  statusCode: number
  valid: boolean
  error?: string
}

export default function RedirectsPage() {
  const [redirects, setRedirects]   = useState<Redirect[]>([])
  const [loading, setLoading]       = useState(true)
  const [deploying, setDeploying]   = useState(false)
  const [deployMsg, setDeployMsg]   = useState('')
  const [hasUnsynced, setHasUnsynced] = useState(false)

  const [source, setSource]           = useState('')
  const [destination, setDestination] = useState('')
  const [statusCode, setStatusCode]   = useState(301)
  const [adding, setAdding]           = useState(false)
  const [addError, setAddError]       = useState('')

  const [csvText, setCsvText]         = useState('')
  const [csvRows, setCsvRows]         = useState<CsvRow[]>([])
  const [importing, setImporting]     = useState(false)
  const [showCsv, setShowCsv]         = useState(false)

  useEffect(() => { fetchRedirects() }, [])

  async function fetchRedirects() {
    setLoading(true)
    const res = await fetch('/api/admin/redirects')
    const data = await res.json()
    setRedirects(data)
    setLoading(false)
  }

  async function addRedirect() {
    setAddError('')
    if (!source.startsWith('/')) {
      setAddError('Source must start with /')
      return
    }
    if (!destination) {
      setAddError('Destination is required')
      return
    }
    setAdding(true)
    const res = await fetch('/api/admin/redirects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, destination, statusCode, isActive: true }),
    })
    const data = await res.json()
    if (res.ok) {
      setRedirects(prev => [data, ...prev])
      setSource('')
      setDestination('')
      setStatusCode(301)
      setHasUnsynced(true)
    } else {
      setAddError(data.error ?? 'Failed to add redirect')
    }
    setAdding(false)
  }

  async function toggleActive(r: Redirect) {
    await fetch(`/api/admin/redirects/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !r.isActive }),
    })
    setRedirects(prev => prev.map(x => x.id === r.id ? { ...x, isActive: !x.isActive } : x))
    setHasUnsynced(true)
  }

  async function deleteRedirect(id: string, source: string) {
    if (!confirm(`Delete redirect "${source}"?`)) return
    await fetch(`/api/admin/redirects/${id}`, { method: 'DELETE' })
    setRedirects(prev => prev.filter(x => x.id !== id))
    setHasUnsynced(true)
  }

  async function triggerDeploy() {
    setDeploying(true)
    setDeployMsg('')
    const res = await fetch('/api/admin/redirects/deploy', { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setDeployMsg('✓ Deploy triggered — redirects will be live in ~2 minutes')
      setHasUnsynced(false)
    } else {
      setDeployMsg(`✗ ${data.error}`)
    }
    setDeploying(false)
  }

  function parseCsv() {
    const lines = csvText.trim().split('\n').filter(l => l.trim())
    const rows: CsvRow[] = lines
      .filter(line => !line.startsWith('source'))
      .map(line => {
        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''))
        const src         = parts[0] ?? ''
        const dst         = parts[1] ?? ''
        const code        = parseInt(parts[2] ?? '301')
        const sc          = [301, 302].includes(code) ? code : 301

        if (!src.startsWith('/')) {
          return { source: src, destination: dst, statusCode: sc, valid: false, error: 'Source must start with /' }
        }
        if (!dst) {
          return { source: src, destination: dst, statusCode: sc, valid: false, error: 'Destination is empty' }
        }
        return { source: src, destination: dst, statusCode: sc, valid: true }
      })
    setCsvRows(rows)
  }

  async function importCsv() {
    const valid = csvRows.filter(r => r.valid)
    if (valid.length === 0) return
    setImporting(true)
    const res = await fetch('/api/admin/redirects/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: valid }),
    })
    const data = await res.json()
    if (res.ok) {
      await fetchRedirects()
      setCsvText('')
      setCsvRows([])
      setShowCsv(false)
      setHasUnsynced(true)
      alert(`Imported ${data.created} rules, skipped ${data.skipped} duplicates`)
    }
    setImporting(false)
  }

  const active301   = redirects.filter(r => r.isActive && r.statusCode === 301).length
  const active302   = redirects.filter(r => r.isActive && r.statusCode === 302).length
  const totalActive = redirects.filter(r => r.isActive).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-[#0f172a] dark:text-gray-100">Redirects manager</h1>
          <p className="text-sm text-[#475569] dark:text-gray-400 mt-1">
            301/302 rules · stored in DB · synced to next.config.mjs · live after deploy
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCsv(v => !v)}
            className="px-3 py-2 text-sm border border-[#e2e8f0] dark:border-white/10 rounded-lg bg-white dark:bg-transparent text-[#475569] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Import CSV
          </button>
          <button
            onClick={triggerDeploy}
            disabled={deploying}
            className="px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 flex items-center gap-2"
            style={{ background: '#BA7517' }}
          >
            {deploying ? 'Deploying…' : 'Sync & deploy'}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-[#f8fafc] dark:bg-gray-800 border border-[#e2e8f0] dark:border-white/10 rounded-lg px-4 py-3 text-sm text-[#475569] dark:text-gray-400 mb-5 flex items-start gap-2">
        <span className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0">ℹ</span>
        <span>
          Redirects are written to <code className="text-xs bg-[#f1f5f9] dark:bg-gray-700 px-1.5 py-0.5 rounded text-[#0f172a] dark:text-gray-200">next.config.mjs</code> and
          take effect after Vercel redeploys. Click <strong className="text-[#0f172a] dark:text-gray-200">Sync & deploy</strong> after making changes.
        </span>
      </div>

      {/* Deploy message */}
      {deployMsg && (
        <div className={`rounded-lg px-4 py-3 text-sm mb-5 ${
          deployMsg.startsWith('✓')
            ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20'
            : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'
        }`}>
          {deployMsg}
        </div>
      )}

      {/* Unsynced warning */}
      {hasUnsynced && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-4 py-3 text-sm text-amber-700 dark:text-amber-400 mb-5 flex items-center justify-between">
          <span>⚠ You have undeployed changes — click &quot;Sync &amp; deploy&quot; to make them live</span>
          <button
            onClick={triggerDeploy}
            disabled={deploying}
            className="text-xs px-3 py-1.5 rounded-lg text-white ml-4 flex-shrink-0"
            style={{ background: '#BA7517' }}
          >
            Deploy now
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total rules',   val: redirects.length },
          { label: 'Active',        val: totalActive,  color: 'text-teal-600 dark:text-teal-400' },
          { label: '301 Permanent', val: active301 },
          { label: '302 Temporary', val: active302 },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 border border-[#e2e8f0] dark:border-white/10 rounded-lg p-3">
            <p className="text-xs text-[#94a3b8] dark:text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-semibold text-[#0f172a] dark:text-white ${s.color ?? ''}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Add rule form */}
      <div className="border border-[#e2e8f0] dark:border-white/10 rounded-xl p-4 bg-white dark:bg-gray-800 mb-5">
        <p className="text-sm font-medium text-[#0f172a] dark:text-gray-100 mb-3">Add redirect rule</p>
        <div className="flex flex-col gap-2 lg:grid lg:grid-cols-[2fr_2fr_120px_100px_auto] lg:gap-3 lg:items-end">
          <div>
            <label className="text-xs text-[#475569] dark:text-gray-400 block mb-1">Source path</label>
            <input
              className="w-full bg-white dark:bg-gray-700 border border-[#e2e8f0] dark:border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-[#dc2626] dark:text-red-400"
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="/old-page"
            />
          </div>
          <div>
            <label className="text-xs text-[#475569] dark:text-gray-400 block mb-1">Destination</label>
            <input
              className="w-full bg-white dark:bg-gray-700 border border-[#e2e8f0] dark:border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-[#1e40af] dark:text-teal-400"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="/new-page"
            />
          </div>
          <div>
            <label className="text-xs text-[#475569] dark:text-gray-400 block mb-1">Type</label>
            <select
              className="w-full bg-white dark:bg-gray-700 border border-[#e2e8f0] dark:border-white/10 rounded-lg px-3 py-2 text-sm text-[#0f172a] dark:text-gray-100"
              value={statusCode}
              onChange={e => setStatusCode(Number(e.target.value))}
            >
              <option value={301}>301 Permanent</option>
              <option value={302}>302 Temporary</option>
            </select>
          </div>
          <div className="mt-2 lg:mt-0 lg:pt-5">
            <button
              onClick={addRedirect}
              disabled={adding}
              className="w-full py-2 text-sm rounded-lg text-white disabled:opacity-50"
              style={{ background: '#023340' }}
            >
              {adding ? 'Adding…' : '+ Add rule'}
            </button>
          </div>
        </div>
        {addError && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-2">{addError}</p>
        )}
      </div>

      {/* Rules list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-[#f1f5f9] dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : redirects.length === 0 ? (
        <div className="text-center py-12 text-[#94a3b8] dark:text-gray-500 text-sm border border-[#e2e8f0] dark:border-white/10 rounded-xl">
          No redirect rules yet. Add your first rule above.
        </div>
      ) : (
        <>
          {/* Mobile cards — visible below lg */}
          <div className="block lg:hidden space-y-2 mb-5">
            {redirects.map(r => (
              <div
                key={r.id}
                className="bg-white dark:bg-gray-800/60 rounded-xl border border-[#e2e8f0] dark:border-gray-700 p-3"
              >
                <p className="font-mono text-sm font-medium text-[#dc2626] dark:text-red-400 truncate">{r.source}</p>
                <p className="font-mono text-xs text-[#1e40af] dark:text-gray-400 truncate mt-1">
                  <span className="text-[#94a3b8] dark:text-gray-500 mr-1">→</span>{r.destination}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    r.statusCode === 301
                      ? 'bg-amber-50 text-amber-700 dark:bg-teal-500/10 dark:text-teal-400'
                      : 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'
                  }`}>
                    {r.statusCode}
                  </span>
                  <button
                    onClick={() => toggleActive(r)}
                    className={`text-xs px-2 py-0.5 rounded ${
                      r.isActive
                        ? 'bg-[#dcfce7] text-[#15803d] dark:bg-teal-500/10 dark:text-teal-400'
                        : 'bg-[#f1f5f9] text-[#94a3b8] dark:bg-gray-700 dark:text-gray-500'
                    }`}
                  >
                    {r.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#f1f5f9] dark:bg-gray-700/60 text-[#475569] dark:text-gray-400">
                    {r.statusCode === 301 ? 'Permanent' : 'Temporary'}
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <a
                    href={`https://www.cosscloudsol.com${r.source}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-xs py-1.5 border border-blue-200 dark:border-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                  >
                    Test ↗
                  </a>
                  <button
                    onClick={() => {}}
                    className="flex-1 text-xs py-1.5 border border-sky-200 dark:border-amber-500/20 rounded-lg text-sky-600 dark:text-amber-400 hover:bg-sky-50 dark:hover:bg-amber-500/10 flex items-center justify-center gap-1"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => deleteRedirect(r.id, r.source)}
                    className="flex-1 text-xs py-1.5 border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table — hidden below lg */}
          <div className="hidden lg:block border border-[#e2e8f0] dark:border-white/10 rounded-xl overflow-hidden mb-5">
            <div className="grid grid-cols-[2fr_2fr_80px_80px_80px_60px] px-4 py-2.5 bg-[#f8fafc] dark:bg-gray-800 border-b border-[#e2e8f0] dark:border-white/10">
              {['Source', 'Destination', 'Type', 'Status', 'Test', 'Delete'].map(h => (
                <span key={h} className="text-xs text-[#94a3b8] dark:text-gray-500 uppercase tracking-wide">{h}</span>
              ))}
            </div>
            {redirects.map(r => (
              <div
                key={r.id}
                className="grid grid-cols-[2fr_2fr_80px_80px_80px_60px] px-4 py-3 border-b border-[#f1f5f9] dark:border-white/5 last:border-0 items-center hover:bg-[#f8fafc] dark:hover:bg-gray-800/50"
              >
                <span className="font-mono text-xs text-[#dc2626] dark:text-red-400 truncate pr-2">{r.source}</span>
                <span className="font-mono text-xs text-[#1e40af] dark:text-teal-400 truncate pr-2">{r.destination}</span>
                <span className={`text-xs px-2 py-0.5 rounded w-fit ${
                  r.statusCode === 301
                    ? 'bg-amber-50 text-amber-700 dark:bg-teal-500/10 dark:text-teal-400'
                    : 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'
                }`}>
                  {r.statusCode}
                </span>
                <button
                  onClick={() => toggleActive(r)}
                  className={`text-xs px-2 py-0.5 rounded w-fit ${
                    r.isActive
                      ? 'bg-[#dcfce7] text-[#15803d] dark:bg-teal-500/10 dark:text-teal-400'
                      : 'bg-[#f1f5f9] text-[#94a3b8] dark:bg-gray-700 dark:text-gray-500'
                  }`}
                >
                  {r.isActive ? 'Active' : 'Inactive'}
                </button>
                <a
                  href={`https://www.cosscloudsol.com${r.source}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Test ↗
                </a>
                <button
                  onClick={() => deleteRedirect(r.id, r.source)}
                  className="text-xs px-2 py-0.5 border border-red-200 dark:border-red-500/20 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CSV Import */}
      {showCsv && (
        <div className="border border-[#e2e8f0] dark:border-white/10 rounded-xl p-4 bg-white dark:bg-gray-800">
          <p className="text-sm font-medium text-[#0f172a] dark:text-gray-100 mb-1">Import from CSV</p>
          <p className="text-xs text-[#94a3b8] dark:text-gray-500 mb-3">
            Format: <code className="bg-[#f1f5f9] dark:bg-gray-700 px-1 rounded text-[#0f172a] dark:text-gray-300">source,destination,statusCode</code> — one rule per line. Header row optional.
          </p>
          <textarea
            className="w-full h-24 bg-[#f8fafc] dark:bg-gray-700 border border-[#e2e8f0] dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-[#0f172a] dark:text-gray-300 resize-none mb-3"
            placeholder={`/old-url-1,/new-url-1,301\n/old-url-2,/new-url-2,302\n/old-url-3,/new-url-3,301`}
            value={csvText}
            onChange={e => { setCsvText(e.target.value); setCsvRows([]) }}
          />
          <div className="flex gap-2 mb-3">
            <button
              onClick={parseCsv}
              disabled={!csvText.trim()}
              className="px-3 py-1.5 text-sm border border-[#e2e8f0] dark:border-white/10 rounded-lg bg-white dark:bg-transparent text-[#475569] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Parse & preview
            </button>
            {csvRows.length > 0 && (
              <button
                onClick={importCsv}
                disabled={importing || csvRows.filter(r => r.valid).length === 0}
                className="px-3 py-1.5 text-sm rounded-lg text-white disabled:opacity-50"
                style={{ background: '#023340' }}
              >
                {importing ? 'Importing…' : `Import ${csvRows.filter(r => r.valid).length} valid rules`}
              </button>
            )}
          </div>

          {csvRows.length > 0 && (
            <div className="border border-[#e2e8f0] dark:border-white/10 rounded-lg overflow-hidden">
              {csvRows.map((row, i) => (
                <div key={i} className={`flex items-center gap-3 px-3 py-2 text-xs border-b border-[#f1f5f9] dark:border-white/5 last:border-0 ${
                  row.valid ? '' : 'opacity-50'
                }`}>
                  <span className={row.valid ? 'text-teal-600 dark:text-teal-400' : 'text-red-500 dark:text-red-400'}>
                    {row.valid ? '✓' : '✗'}
                  </span>
                  <span className="font-mono text-[#dc2626] dark:text-red-400">{row.source}</span>
                  <span className="text-[#94a3b8] dark:text-gray-500">→</span>
                  <span className="font-mono text-[#1e40af] dark:text-teal-400">{row.destination}</span>
                  <span className="text-[#94a3b8] dark:text-gray-500 ml-auto">{row.statusCode}</span>
                  {row.error && <span className="text-red-500 dark:text-red-400">{row.error}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

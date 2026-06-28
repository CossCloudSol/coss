'use client'

import { useEffect, useState } from 'react'

interface GlobalSchemaSettings {
  schemaOrgEnabled:       boolean
  schemaWebSiteEnabled:   boolean
  schemaDilsEnabled:      boolean
  schemaAmeerpetEnabled:  boolean
  schemaOrgOverride:      string | null
  schemaWebSiteOverride:  string | null
  schemaDilsOverride:     string | null
  schemaAmeerpetOverride: string | null
}

interface SchemaPage {
  slug:           string
  name:           string
  types:          string[]
  schemaEnabled:  boolean
  schemaOverride: string | null
}

interface ValidateResult {
  url:            string
  count:          number
  schemas:        object[]
  richResultsUrl: string
}

const GLOBAL_SCHEMAS = [
  {
    key:         'schemaOrg',
    label:       'Organization + EducationalOrganization',
    desc:        'Entity anchor — powers Google Knowledge Panel and AI entity recognition',
    enabledKey:  'schemaOrgEnabled'  as keyof GlobalSchemaSettings,
    overrideKey: 'schemaOrgOverride' as keyof GlobalSchemaSettings,
    types:       ['Organization', 'EducationalOrganization'],
    icon:        '🏢',
  },
  {
    key:         'schemaWebSite',
    label:       'WebSite + SearchAction',
    desc:        'Powers Sitelinks Search Box in Google results',
    enabledKey:  'schemaWebSiteEnabled'  as keyof GlobalSchemaSettings,
    overrideKey: 'schemaWebSiteOverride' as keyof GlobalSchemaSettings,
    types:       ['WebSite', 'SearchAction'],
    icon:        '🌐',
  },
  {
    key:         'schemaDils',
    label:       'LocalBusiness — Dilsukhnagar',
    desc:        'Powers Google Maps Local Pack for Dilsukhnagar branch',
    enabledKey:  'schemaDilsEnabled'  as keyof GlobalSchemaSettings,
    overrideKey: 'schemaDilsOverride' as keyof GlobalSchemaSettings,
    types:       ['LocalBusiness', 'EducationalOrganization'],
    icon:        '📍',
  },
  {
    key:         'schemaAmeerpet',
    label:       'LocalBusiness — Ameerpet',
    desc:        'Powers Google Maps Local Pack for Ameerpet branch',
    enabledKey:  'schemaAmeerpetEnabled'  as keyof GlobalSchemaSettings,
    overrideKey: 'schemaAmeerpetOverride' as keyof GlobalSchemaSettings,
    types:       ['LocalBusiness', 'EducationalOrganization'],
    icon:        '📍',
  },
]

const QUICK_URLS = [
  { label: 'Homepage',         value: 'https://www.cosscloudsol.com' },
  { label: 'AWS landing page', value: 'https://www.cosscloudsol.com/aws-training-hyderabad' },
  { label: 'About Us',         value: 'https://www.cosscloudsol.com/about-us' },
  { label: 'Blog',             value: 'https://www.cosscloudsol.com/blog' },
]

export default function SchemaPage() {
  const [tab, setTab] = useState<'global' | 'pages' | 'validate'>('global')

  // ── Tab 1: Global state ───────────────────────────────────────────────────
  const [settings, setSettings]       = useState<GlobalSchemaSettings | null>(null)
  const [rendered, setRendered]       = useState<object[]>([])
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [editingKey, setEditingKey]   = useState<string | null>(null)
  const [editJson, setEditJson]       = useState('')
  const [jsonError, setJsonError]     = useState('')
  const [saving, setSaving]           = useState(false)
  const [globalMsg, setGlobalMsg]     = useState('')

  // ── Tab 2: Pages state ───────────────────────────────────────────────────
  const [pages, setPages]               = useState<SchemaPage[]>([])
  const [pagesLoaded, setPagesLoaded]   = useState(false)
  const [editingSlug, setEditingSlug]   = useState<string | null>(null)
  const [editingOverride, setEditingOverride] = useState('')
  const [pageJsonError, setPageJsonError]     = useState('')
  const [viewingSlug, setViewingSlug]         = useState<string | null>(null)
  const [pageSaving, setPageSaving]           = useState<string | null>(null)
  const [pageMsg, setPageMsg]                 = useState('')

  // ── Tab 3: Validate state ─────────────────────────────────────────────────
  const [validateUrl, setValidateUrl]       = useState('https://www.cosscloudsol.com')
  const [validating, setValidating]         = useState(false)
  const [validateResult, setValidateResult] = useState<ValidateResult | null>(null)
  const [validateError, setValidateError]   = useState('')
  const [expandedSchema, setExpandedSchema] = useState<number | null>(null)

  const [setupDismissed, setSetupDismissed] = useState(true) // true until hydrated to avoid flash

  useEffect(() => {
    setSetupDismissed(localStorage.getItem('schema_setup_done') === '1')
  }, [])

  function dismissSetup() {
    localStorage.setItem('schema_setup_done', '1')
    setSetupDismissed(true)
  }

  // Load global schemas on mount
  useEffect(() => {
    fetch('/api/admin/schema/global')
      .then(r => r.json())
      .then(data => {
        setSettings(data.settings ?? {})
        setRendered(data.rendered ?? [])
      })
  }, [])

  // Load pages when switching to tab 2
  useEffect(() => {
    if (tab === 'pages' && !pagesLoaded) {
      fetch('/api/admin/schema/pages')
        .then(r => r.json())
        .then(data => { setPages(data); setPagesLoaded(true) })
    }
  }, [tab, pagesLoaded])

  async function toggleSchema(enabledKey: string, value: boolean) {
    setSaving(true)
    setGlobalMsg('')
    await fetch('/api/admin/schema/global', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [enabledKey]: value }),
    })
    setSettings(prev => prev ? { ...prev, [enabledKey]: value } : prev)
    setSaving(false)
    setGlobalMsg(value ? 'Schema enabled.' : 'Schema disabled.')
    setTimeout(() => setGlobalMsg(''), 2500)
  }

  function startEdit(overrideKey: string, currentVal: string | null) {
    setEditingKey(overrideKey)
    setEditJson(currentVal ? JSON.stringify(JSON.parse(currentVal), null, 2) : '')
    setJsonError('')
  }

  async function saveOverride(overrideKey: string) {
    setJsonError('')
    try { JSON.parse(editJson) } catch {
      setJsonError('Invalid JSON — fix before saving')
      return
    }
    setSaving(true)
    await fetch('/api/admin/schema/global', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [overrideKey]: editJson }),
    })
    setSettings(prev => prev ? { ...prev, [overrideKey]: editJson } : prev)
    setEditingKey(null)
    setSaving(false)
    setGlobalMsg('Override saved.')
    setTimeout(() => setGlobalMsg(''), 2500)
  }

  async function clearOverride(overrideKey: string) {
    setSaving(true)
    await fetch('/api/admin/schema/global', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [overrideKey]: null }),
    })
    setSettings(prev => prev ? { ...prev, [overrideKey]: null } : prev)
    setEditingKey(null)
    setSaving(false)
    setGlobalMsg('Override cleared — using auto-generated schema.')
    setTimeout(() => setGlobalMsg(''), 2500)
  }

  async function togglePageSchema(slug: string, value: boolean) {
    setPageSaving(slug)
    setPageMsg('')
    await fetch(`/api/admin/schema/pages/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemaEnabled: value }),
    })
    setPages(prev => prev.map(p => p.slug === slug ? { ...p, schemaEnabled: value } : p))
    setPageSaving(null)
    setPageMsg(value ? 'Schema enabled.' : 'Schema disabled.')
    setTimeout(() => setPageMsg(''), 2500)
  }

  function startPageEdit(slug: string, override: string | null) {
    setEditingSlug(slug)
    setEditingOverride(override ? JSON.stringify(JSON.parse(override), null, 2) : '')
    setPageJsonError('')
    setViewingSlug(null)
  }

  async function savePageOverride(slug: string) {
    setPageJsonError('')
    try { JSON.parse(editingOverride) } catch {
      setPageJsonError('Invalid JSON — fix before saving')
      return
    }
    setPageSaving(slug)
    await fetch(`/api/admin/schema/pages/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemaOverride: editingOverride }),
    })
    setPages(prev => prev.map(p => p.slug === slug ? { ...p, schemaOverride: editingOverride } : p))
    setEditingSlug(null)
    setPageSaving(null)
    setPageMsg('Override saved.')
    setTimeout(() => setPageMsg(''), 2500)
  }

  async function clearPageOverride(slug: string) {
    setPageSaving(slug)
    await fetch(`/api/admin/schema/pages/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemaOverride: null }),
    })
    setPages(prev => prev.map(p => p.slug === slug ? { ...p, schemaOverride: null } : p))
    setEditingSlug(null)
    setPageSaving(null)
    setPageMsg('Override cleared.')
    setTimeout(() => setPageMsg(''), 2500)
  }

  async function validateSchema() {
    setValidating(true)
    setValidateError('')
    setValidateResult(null)
    setExpandedSchema(null)
    const res = await fetch('/api/admin/schema/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: validateUrl }),
    })
    if (!res.ok) {
      const d = await res.json()
      setValidateError(d.error ?? 'Failed to fetch URL')
    } else {
      setValidateResult(await res.json())
    }
    setValidating(false)
  }

  const getSchemaType = (schema: object): string => {
    const s = schema as Record<string, unknown>
    const t = s['@type']
    if (Array.isArray(t)) return t.join(', ')
    return String(t ?? 'Unknown')
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white">Schema Markup Manager</h1>
        <p className="text-[#475569] dark:text-gray-400 text-sm mt-1">
          Control JSON-LD structured data across all site pages. Affects Google Knowledge Panel, Local Pack, Rich Results, and AI engine entity recognition.
        </p>
      </div>

      {/* Supabase SQL reminder */}
      {!setupDismissed && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-amber-700 dark:text-amber-400 text-xs font-semibold mb-1">FIRST TIME SETUP</p>
              <p className="text-amber-700/80 dark:text-amber-200/80 text-xs">
                Run the Phase 1 SQL in your Supabase SQL Editor to add schema columns to PageSeo and SiteSettings before using this page.
              </p>
            </div>
            <button
              onClick={dismissSetup}
              className="shrink-0 text-amber-500/60 dark:text-amber-400/60 hover:text-amber-600 dark:hover:text-amber-400 text-lg leading-none transition-colors"
              aria-label="Dismiss setup banner"
            >
              ×
            </button>
          </div>
          <details className="mt-2">
            <summary className="text-amber-700 dark:text-amber-400 text-xs cursor-pointer hover:underline">Show SQL</summary>
            <pre className="mt-2 text-xs text-green-700 dark:text-green-300 bg-amber-50/50 dark:bg-black/40 rounded p-3 overflow-x-auto whitespace-pre">{`ALTER TABLE "PageSeo"
  ADD COLUMN IF NOT EXISTS "schemaEnabled"  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "schemaOverride" TEXT;

ALTER TABLE "SiteSettings"
  ADD COLUMN IF NOT EXISTS "schemaOrgOverride"         TEXT,
  ADD COLUMN IF NOT EXISTS "schemaWebSiteOverride"     TEXT,
  ADD COLUMN IF NOT EXISTS "schemaDilsOverride"        TEXT,
  ADD COLUMN IF NOT EXISTS "schemaAmeerpetOverride"    TEXT,
  ADD COLUMN IF NOT EXISTS "schemaOrgEnabled"          BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "schemaWebSiteEnabled"      BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "schemaDilsEnabled"         BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "schemaAmeerpetEnabled"     BOOLEAN NOT NULL DEFAULT true;`}</pre>
          </details>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#e2e8f0] dark:border-white/10">
        {(['global', 'pages', 'validate'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              tab === t
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-[#475569] dark:text-gray-400 hover:text-[#0f172a] dark:hover:text-white',
            ].join(' ')}
          >
            {t === 'global' ? 'Global Schemas' : t === 'pages' ? 'Page Schemas' : 'Schema Validator'}
          </button>
        ))}
      </div>

      {/* ── TAB 1: GLOBAL SCHEMAS ─────────────────────────────────────────── */}
      {tab === 'global' && (
        <div>
          {globalMsg && (
            <div className="mb-4 px-4 py-2 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-500/30 rounded text-teal-700 dark:text-teal-300 text-sm">
              {globalMsg}
            </div>
          )}
          <div className="grid gap-4">
            {GLOBAL_SCHEMAS.map((schema, idx) => {
              const enabled  = settings ? Boolean(settings[schema.enabledKey]) : true
              const override = settings ? (settings[schema.overrideKey] as string | null) : null
              const isExpanded = expandedKey === schema.key
              const isEditing  = editingKey  === schema.overrideKey

              // Find rendered schema matching this type
              const renderedSchema = rendered[idx]

              return (
                <div key={schema.key} className="bg-white dark:bg-white/5 border border-[#e2e8f0] dark:border-white/10 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-2xl">{schema.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-[#0f172a] dark:text-white font-semibold text-sm">{schema.label}</h3>
                          {override && (
                            <span className="px-2 py-0.5 rounded text-xs bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                              Custom override
                            </span>
                          )}
                        </div>
                        <p className="text-[#475569] dark:text-gray-400 text-xs mt-0.5">{schema.desc}</p>
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {schema.types.map(t => (
                            <span key={t} className="px-2 py-0.5 rounded text-xs bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Toggle */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs ${enabled ? 'text-teal-600 dark:text-teal-400' : 'text-[#94a3b8] dark:text-gray-500'}`}>
                        {enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <button
                        onClick={() => toggleSchema(schema.enabledKey, !enabled)}
                        disabled={saving}
                        className={[
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                          enabled ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600',
                          saving ? 'opacity-50 cursor-not-allowed' : '',
                        ].join(' ')}
                        aria-label={`Toggle ${schema.label}`}
                      >
                        <span className={[
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          enabled ? 'translate-x-6' : 'translate-x-1',
                        ].join(' ')} />
                      </button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <button
                      onClick={() => setExpandedKey(isExpanded ? null : schema.key)}
                      className="px-3 py-1.5 rounded-lg text-xs border border-[#e2e8f0] dark:border-white/10 text-[#475569] dark:text-gray-300 hover:bg-[#f1f5f9] dark:hover:bg-white/5 transition-colors"
                    >
                      {isExpanded ? 'Hide JSON' : 'View rendered JSON'}
                    </button>
                    <button
                      onClick={() => isEditing ? setEditingKey(null) : startEdit(schema.overrideKey, override)}
                      className="px-3 py-1.5 rounded-lg text-xs border border-[#e2e8f0] dark:border-white/10 text-[#475569] dark:text-gray-300 hover:bg-[#f1f5f9] dark:hover:bg-white/5 transition-colors"
                    >
                      {isEditing ? 'Cancel edit' : 'Edit override'}
                    </button>
                    {override && !isEditing && (
                      <button
                        onClick={() => clearOverride(schema.overrideKey)}
                        disabled={saving}
                        className="px-3 py-1.5 rounded-lg text-xs border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Clear override
                      </button>
                    )}
                    <a
                      href="https://search.google.com/test/rich-results?url=https://www.cosscloudsol.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      Test in Rich Results ↗
                    </a>
                  </div>

                  {/* Rendered JSON view */}
                  {isExpanded && renderedSchema && (
                    <div className="mt-4">
                      <p className="text-[#475569] dark:text-gray-400 text-xs mb-1">Currently rendered schema:</p>
                      <pre className="bg-[#f8fafc] dark:bg-gray-900 text-green-700 dark:text-green-300 text-xs p-3 rounded-lg border border-[#e2e8f0] dark:border-white/10 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre">
                        {JSON.stringify(renderedSchema, null, 2)}
                      </pre>
                    </div>
                  )}
                  {isExpanded && !renderedSchema && (
                    <div className="mt-4 px-3 py-2 bg-[#f8fafc] dark:bg-gray-900/50 rounded-lg text-[#94a3b8] dark:text-gray-500 text-xs">
                      Schema is disabled or not rendered.
                    </div>
                  )}

                  {/* JSON override editor */}
                  {isEditing && (
                    <div className="mt-4">
                      <p className="text-[#475569] dark:text-gray-400 text-xs mb-1">
                        Paste custom JSON-LD override (leave empty to use auto-generated):
                      </p>
                      <textarea
                        value={editJson}
                        onChange={e => setEditJson(e.target.value)}
                        className="w-full font-mono text-xs bg-[#f8fafc] dark:bg-gray-900 text-green-700 dark:text-green-400 p-3 rounded-lg border border-[#e2e8f0] dark:border-white/10 min-h-[200px] resize-y"
                        placeholder='{"@context": "https://schema.org", "@type": "Organization", ...}'
                      />
                      {jsonError && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{jsonError}</p>}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => saveOverride(schema.overrideKey)}
                          disabled={saving}
                          className="px-3 py-1.5 rounded-lg text-xs bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-50"
                        >
                          Save override
                        </button>
                        {override && (
                          <button
                            onClick={() => clearOverride(schema.overrideKey)}
                            disabled={saving}
                            className="px-3 py-1.5 rounded-lg text-xs border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Clear override
                          </button>
                        )}
                        <button
                          onClick={() => { setEditingKey(null); setJsonError('') }}
                          className="px-3 py-1.5 rounded-lg text-xs border border-[#e2e8f0] dark:border-white/10 text-[#475569] dark:text-gray-400 hover:bg-[#f1f5f9] dark:hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: PAGE SCHEMAS ───────────────────────────────────────────── */}
      {tab === 'pages' && (
        <div>
          {pageMsg && (
            <div className="mb-4 px-4 py-2 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-500/30 rounded text-teal-700 dark:text-teal-300 text-sm">
              {pageMsg}
            </div>
          )}
          {!pagesLoaded ? (
            <div className="text-[#475569] dark:text-gray-400 text-sm py-8 text-center">Loading pages...</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] dark:border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0] dark:border-white/10 bg-[#f8fafc] dark:bg-white/5">
                    <th className="text-left px-4 py-3 text-[#475569] dark:text-gray-400 font-medium">Page</th>
                    <th className="text-left px-4 py-3 text-[#475569] dark:text-gray-400 font-medium">Schema types</th>
                    <th className="text-center px-4 py-3 text-[#475569] dark:text-gray-400 font-medium">Enabled</th>
                    <th className="text-center px-4 py-3 text-[#475569] dark:text-gray-400 font-medium">Override</th>
                    <th className="text-right px-4 py-3 text-[#475569] dark:text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9] dark:divide-white/5">
                  {pages.map(page => (
                    <>
                      <tr key={page.slug} className="hover:bg-[#f8fafc] dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-[#0f172a] dark:text-white font-medium">{page.name}</p>
                          <p className="font-mono text-[#94a3b8] dark:text-gray-500 text-xs mt-0.5">{page.slug}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {page.types.map(t => (
                              <span key={t} className="px-2 py-0.5 rounded text-xs bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => togglePageSchema(page.slug, !page.schemaEnabled)}
                            disabled={pageSaving === page.slug}
                            className={[
                              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                              page.schemaEnabled ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600',
                              pageSaving === page.slug ? 'opacity-50 cursor-not-allowed' : '',
                            ].join(' ')}
                          >
                            <span className={[
                              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                              page.schemaEnabled ? 'translate-x-6' : 'translate-x-1',
                            ].join(' ')} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {page.schemaOverride ? (
                            <span className="px-2 py-0.5 rounded text-xs bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                              Custom
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs bg-[#f1f5f9] dark:bg-gray-800 text-[#94a3b8] dark:text-gray-500 border border-[#e2e8f0] dark:border-white/5">
                              Auto
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-1.5 justify-end flex-wrap">
                            <button
                              onClick={() => setViewingSlug(viewingSlug === page.slug ? null : page.slug)}
                              className="px-2.5 py-1 rounded text-xs border border-[#e2e8f0] dark:border-white/10 text-[#475569] dark:text-gray-300 hover:bg-[#f1f5f9] dark:hover:bg-white/5 transition-colors"
                            >
                              {viewingSlug === page.slug ? 'Hide' : 'View JSON'}
                            </button>
                            <button
                              onClick={() => editingSlug === page.slug ? setEditingSlug(null) : startPageEdit(page.slug, page.schemaOverride)}
                              className="px-2.5 py-1 rounded text-xs border border-[#e2e8f0] dark:border-white/10 text-[#475569] dark:text-gray-300 hover:bg-[#f1f5f9] dark:hover:bg-white/5 transition-colors"
                            >
                              {editingSlug === page.slug ? 'Cancel' : 'Edit override'}
                            </button>
                            <a
                              href={`https://search.google.com/test/rich-results?url=https://www.cosscloudsol.com${page.slug.startsWith('*') ? '' : page.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded text-xs border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                              Test ↗
                            </a>
                          </div>
                        </td>
                      </tr>

                      {/* Inline: View JSON */}
                      {viewingSlug === page.slug && (
                        <tr key={`${page.slug}-view`}>
                          <td colSpan={5} className="px-4 pb-4 bg-[#f8fafc] dark:bg-white/3">
                            {page.schemaOverride ? (
                              <pre className="bg-white dark:bg-gray-900 text-green-700 dark:text-green-300 text-xs p-3 rounded-lg border border-[#e2e8f0] dark:border-white/10 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre">
                                {JSON.stringify(JSON.parse(page.schemaOverride), null, 2)}
                              </pre>
                            ) : (
                              <div className="px-3 py-2 bg-[#f1f5f9] dark:bg-gray-900/50 rounded-lg text-[#475569] dark:text-gray-400 text-xs">
                                No override set — auto-generated schema is used based on page content.
                              </div>
                            )}
                          </td>
                        </tr>
                      )}

                      {/* Inline: Edit override */}
                      {editingSlug === page.slug && (
                        <tr key={`${page.slug}-edit`}>
                          <td colSpan={5} className="px-4 pb-4 bg-[#f8fafc] dark:bg-white/3">
                            <textarea
                              value={editingOverride}
                              onChange={e => setEditingOverride(e.target.value)}
                              className="w-full font-mono text-xs bg-[#f8fafc] dark:bg-gray-900 text-green-700 dark:text-green-400 p-3 rounded-lg border border-[#e2e8f0] dark:border-white/10 min-h-[200px] resize-y"
                              placeholder='{"@context": "https://schema.org", "@type": "Course", ...}'
                            />
                            {pageJsonError && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{pageJsonError}</p>}
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => savePageOverride(page.slug)}
                                disabled={pageSaving === page.slug}
                                className="px-3 py-1.5 rounded-lg text-xs bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-50"
                              >
                                Save override
                              </button>
                              {page.schemaOverride && (
                                <button
                                  onClick={() => clearPageOverride(page.slug)}
                                  disabled={pageSaving === page.slug}
                                  className="px-3 py-1.5 rounded-lg text-xs border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                  Clear override
                                </button>
                              )}
                              <button
                                onClick={() => { setEditingSlug(null); setPageJsonError('') }}
                                className="px-3 py-1.5 rounded-lg text-xs border border-[#e2e8f0] dark:border-white/10 text-[#475569] dark:text-gray-400 hover:bg-[#f1f5f9] dark:hover:bg-white/5 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: SCHEMA VALIDATOR ───────────────────────────────────────── */}
      {tab === 'validate' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-white/5 border border-[#e2e8f0] dark:border-white/10 rounded-xl p-5">
            <h3 className="text-[#0f172a] dark:text-white font-semibold mb-3">Fetch & validate JSON-LD from a URL</h3>
            <div className="flex gap-2 flex-wrap">
              <select
                onChange={e => setValidateUrl(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-[#e2e8f0] dark:border-white/10 rounded-lg px-3 py-2 text-sm text-[#475569] dark:text-gray-300 focus:outline-none focus:border-teal-500"
              >
                {QUICK_URLS.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
              <input
                type="url"
                value={validateUrl}
                onChange={e => setValidateUrl(e.target.value)}
                placeholder="https://www.cosscloudsol.com/page"
                className="flex-1 min-w-[280px] bg-white dark:bg-gray-800 border border-[#e2e8f0] dark:border-white/10 rounded-lg px-3 py-2 text-sm text-[#0f172a] dark:text-white placeholder-[#94a3b8] dark:placeholder-gray-500 focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={validateSchema}
                disabled={validating || !validateUrl}
                className="px-4 py-2 rounded-lg text-sm bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validating ? 'Fetching…' : 'Validate'}
              </button>
            </div>
          </div>

          {validateError && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/30 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {validateError}
            </div>
          )}

          {validateResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-[#0f172a] dark:text-white font-semibold">
                    Found <span className="text-teal-600 dark:text-teal-400">{validateResult.count}</span> schema{validateResult.count !== 1 ? 's' : ''} on this page
                  </p>
                  <p className="text-[#94a3b8] dark:text-gray-400 text-xs mt-0.5 font-mono">{validateResult.url}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={validateResult.richResultsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-sm border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    Test in Rich Results ↗
                  </a>
                  <a
                    href={validateResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-sm border border-[#e2e8f0] dark:border-white/10 text-[#475569] dark:text-gray-300 hover:bg-[#f1f5f9] dark:hover:bg-white/5 transition-colors"
                  >
                    View page source ↗
                  </a>
                </div>
              </div>

              {validateResult.count === 0 && (
                <div className="px-4 py-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-300 text-sm text-center">
                  No JSON-LD schemas found on this page. The page may not be publicly accessible or has no structured data.
                </div>
              )}

              {validateResult.schemas.map((schema, i) => {
                const type = getSchemaType(schema)
                const isOpen = expandedSchema === i
                return (
                  <div key={i} className="bg-white dark:bg-white/5 border border-[#e2e8f0] dark:border-white/10 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedSchema(isOpen ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#f8fafc] dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[#94a3b8] dark:text-gray-400 text-xs font-mono">#{i + 1}</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {type.split(', ').map(t => (
                            <span key={t} className="px-2 py-0.5 rounded text-xs bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-[#94a3b8] dark:text-gray-400 text-xs">{isOpen ? '▲ Hide' : '▼ Show'}</span>
                    </button>
                    {isOpen && (
                      <pre className="bg-[#f8fafc] dark:bg-gray-900 text-green-700 dark:text-green-300 text-xs p-4 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre border-t border-[#e2e8f0] dark:border-white/10">
                        {JSON.stringify(schema, null, 2)}
                      </pre>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

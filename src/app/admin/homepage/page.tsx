'use client'

import { useEffect, useState, useCallback } from 'react'

type Course = {
  id: string
  title: string
  slug: string
  categorySlug: string | null
  courseCategory?: { name: string } | null
  status: string
}

type Settings = {
  heroHeadline: string
  heroSubtext: string
  heroCTAPrimaryText: string
  heroCTAPrimaryUrl: string
  heroCTASecondaryText: string
  heroCTASecondaryUrl: string
  stat1Value: string; stat1Label: string
  stat2Value: string; stat2Label: string
  stat3Value: string; stat3Label: string
  stat4Value: string; stat4Label: string
  announcementEnabled: boolean
  announcementText: string
  announcementUrl: string
  announcementBgColor: string
  featuredCourseIds: string[]
  featuredSectionTitle: string
  featuredSectionSubtext: string
  showFeaturedCourses: boolean
  showTestimonials: boolean
  showHiringPartners: boolean
  showStats: boolean
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">{icon}</span>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, maxLength, disabled }: { value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; disabled?: boolean }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent${disabled ? ' opacity-60 cursor-not-allowed' : ''}`}
      />
      {maxLength && (
        <span className="absolute right-2 top-2 text-xs text-gray-400">{value.length}/{maxLength}</span>
      )}
    </div>
  )
}

function Textarea({ value, onChange, rows = 3, maxLength }: { value: string; onChange: (v: string) => void; rows?: number; maxLength?: number }) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
      />
      {maxLength && (
        <span className="absolute right-2 bottom-2 text-xs text-gray-400">{value.length}/{maxLength}</span>
      )}
    </div>
  )
}

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!enabled)}
        className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  )
}

export default function HomepageManagerPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [courseSearch, setCourseSearch] = useState('')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/homepage').then((r) => r.json()),
      fetch('/api/admin/courses?status=published&limit=500').then((r) => r.json()),
    ])
      .then(([s, c]) => {
        setSettings(s as Settings)
        const courseData = c as { courses?: Course[] } | Course[]
        setCourses(Array.isArray(courseData) ? courseData : (courseData as { courses?: Course[] }).courses ?? [])
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))
    setDirty(true)
  }, [])

  const save = async () => {
    if (!settings) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Save failed')
      setSavedAt(new Date().toLocaleTimeString())
      setDirty(false)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const toggleFeaturedCourse = (id: string) => {
    if (!settings) return
    const current = settings.featuredCourseIds
    const next = current.includes(id)
      ? current.filter((c) => c !== id)
      : current.length >= 8 ? current : [...current, id]
    update('featuredCourseIds', next)
  }

  const filteredCourses = courses.filter(
    (c) =>
      c.title?.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.categorySlug?.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.courseCategory?.name?.toLowerCase().includes(courseSearch.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading homepage settings...</span>
        </div>
      </div>
    )
  }

  if (!settings) {
    return <div className="p-6 text-red-600 text-sm">Failed to load settings. Check your database connection.</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Homepage Manager</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Control all frontend content — no code changes needed</p>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && !dirty && <span className="text-xs text-green-600 dark:text-green-400">Saved at {savedAt}</span>}
          {dirty && <span className="text-xs text-orange-500">Unsaved changes</span>}
          <a href="/" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
            Preview
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      {/* Announcement Bar */}
      <SectionCard title="Announcement Bar" icon="📣">
        <Toggle enabled={settings.announcementEnabled} onChange={(v) => update('announcementEnabled', v)} label="Show announcement bar at top of site" />
        <div className="mt-4 space-y-3">
          <Field label="Message" hint="Shown across the full top bar. Keep under 100 characters.">
            <Input value={settings.announcementText} onChange={(v) => update('announcementText', v)} maxLength={120} placeholder="Next batch starts 1 Jul 2026 — Limited seats!" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Link URL">
              <Input value={settings.announcementUrl} onChange={(v) => update('announcementUrl', v)} placeholder="/enroll-now-with-coss" />
            </Field>
            <Field label="Background colour">
              <div className="flex items-center gap-2">
                <input type="color" value={settings.announcementBgColor} onChange={(e) => update('announcementBgColor', e.target.value)} className="w-10 h-9 rounded cursor-pointer border border-gray-200 dark:border-gray-600 p-0.5" />
                <input type="text" value={settings.announcementBgColor} onChange={(e) => update('announcementBgColor', e.target.value)} className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </Field>
          </div>
          <div className="rounded-lg px-4 py-2.5 text-sm text-white font-medium text-center" style={{ backgroundColor: settings.announcementBgColor }}>
            {settings.announcementText || 'Announcement preview'}
          </div>
        </div>
      </SectionCard>

      {/* Hero Section */}
      <SectionCard title="Hero Section" icon="🎯">
        <Field label="Headline" hint="Currently controlled by the hero design (fixed copy + per-word colors), not this field. Kept here in case the hero is redesigned again later.">
          <Input value={settings.heroHeadline} onChange={(v) => update('heroHeadline', v)} maxLength={80} placeholder="Launch Your IT Career in Hyderabad" disabled />
        </Field>
        <Field label="Subtext" hint="Supporting text under the headline. 1–2 sentences. Live on the homepage hero.">
          <Textarea value={settings.heroSubtext} onChange={(v) => update('heroSubtext', v)} rows={2} maxLength={200} />
        </Field>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Button text below is live on the hero. The URL fields are currently unused there — both hero
          buttons scroll down to the on-page &quot;Book Your Free Demo Class&quot; form instead of navigating away.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Primary CTA</p>
            <Field label="Button text"><Input value={settings.heroCTAPrimaryText} onChange={(v) => update('heroCTAPrimaryText', v)} placeholder="Enroll Now" /></Field>
            <Field label="URL (unused on hero — see note above)"><Input value={settings.heroCTAPrimaryUrl} onChange={(v) => update('heroCTAPrimaryUrl', v)} placeholder="/enroll-now-with-coss" /></Field>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Secondary CTA</p>
            <Field label="Button text"><Input value={settings.heroCTASecondaryText} onChange={(v) => update('heroCTASecondaryText', v)} placeholder="Free Demo Class" /></Field>
            <Field label="URL (unused on hero — see note above)"><Input value={settings.heroCTASecondaryUrl} onChange={(v) => update('heroCTASecondaryUrl', v)} placeholder="/free-demo-class" /></Field>
          </div>
        </div>
      </SectionCard>

      {/* Stats Bar */}
      <SectionCard title="Hero Trust Indicators" icon="📊">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Only the label (bottom field) is shown on the homepage hero — as one of the 4 icon + text
          trust indicators (icons are fixed: Users, BadgeCheck, Briefcase, TrendingUp). The value
          (top field) is unused there now, except stat2&apos;s value which still feeds the &quot;Placements&quot; count in the top info bar.
        </p>
        <Toggle enabled={settings.showStats} onChange={(v) => update('showStats', v)} label="Show stats bar on homepage (legacy — not currently wired to any section)" />
        <div className="mt-4">
          <div className="grid grid-cols-4 gap-2 mb-2">
            {([
              { v: 'stat1Value', l: 'stat1Label', vp: '15+', lp: 'Expert Trainers' },
              { v: 'stat2Value', l: 'stat2Label', vp: '5000+', lp: 'Industry Recognized' },
              { v: 'stat3Value', l: 'stat3Label', vp: '30+', lp: 'Placement Assistance' },
              { v: 'stat4Value', l: 'stat4Label', vp: '50+', lp: 'Career Growth' },
            ] as const).map((s, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <input
                  type="text"
                  value={settings[s.v] as string}
                  onChange={(e) => update(s.v, e.target.value)}
                  placeholder={s.vp}
                  className="w-full text-center text-lg font-bold text-orange-500 bg-transparent border-0 border-b border-gray-200 dark:border-gray-600 focus:outline-none focus:border-orange-500 mb-1 pb-1"
                />
                <input
                  type="text"
                  value={settings[s.l] as string}
                  onChange={(e) => update(s.l, e.target.value)}
                  placeholder={s.lp}
                  className="w-full text-center text-xs text-gray-500 bg-transparent border-0 focus:outline-none"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Click any value or label above to edit it directly.</p>
        </div>
      </SectionCard>

      {/* Featured Courses */}
      <SectionCard title="Featured Courses" icon="⭐">
        <Toggle enabled={settings.showFeaturedCourses} onChange={(v) => update('showFeaturedCourses', v)} label="Show featured courses section" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Section title"><Input value={settings.featuredSectionTitle} onChange={(v) => update('featuredSectionTitle', v)} placeholder="Popular Courses" /></Field>
          <Field label="Section subtext"><Input value={settings.featuredSectionSubtext} onChange={(v) => update('featuredSectionSubtext', v)} placeholder="Industry-relevant curriculum..." /></Field>
        </div>
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Pinned courses <span className="text-xs text-gray-400 font-normal">({settings.featuredCourseIds.length}/8 selected)</span>
            </p>
            {settings.featuredCourseIds.length > 0 && (
              <button onClick={() => update('featuredCourseIds', [])} className="text-xs text-red-500 hover:text-red-700">Clear all</button>
            )}
          </div>
          {settings.featuredCourseIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {settings.featuredCourseIds.map((id) => {
                const course = courses.find((c) => c.id === id)
                if (!course) return null
                return (
                  <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-400 text-xs rounded-full">
                    {course.title}
                    <button onClick={() => toggleFeaturedCourse(id)} className="hover:text-red-600 transition-colors">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </span>
                )
              })}
            </div>
          )}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <input type="text" value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} placeholder="Search courses..." className="w-full px-2 py-1 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none" />
            </div>
            <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {filteredCourses.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No courses found</p>
              ) : filteredCourses.map((course) => {
                const selected = settings.featuredCourseIds.includes(course.id)
                const disabled = !selected && settings.featuredCourseIds.length >= 8
                return (
                  <button key={course.id} onClick={() => !disabled && toggleFeaturedCourse(course.id)} disabled={disabled}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${selected ? 'bg-orange-50 dark:bg-orange-900/20' : disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <div className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${selected ? 'bg-orange-500 border-orange-500' : 'border-gray-300 dark:border-gray-600'}`}>
                      {selected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white truncate">{course.title}</p>
                      <p className="text-xs text-gray-400 truncate">{course.courseCategory?.name ?? course.categorySlug}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
          {settings.featuredCourseIds.length >= 8 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Maximum 8 featured courses. Remove one to add another.</p>
          )}
        </div>
      </SectionCard>

      {/* Section Visibility */}
      <SectionCard title="Section Visibility" icon="👁">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Toggle entire sections on or off. Hidden sections are removed from the page completely.</p>
        <div className="space-y-3">
          <Toggle enabled={settings.showTestimonials} onChange={(v) => update('showTestimonials', v)} label="Testimonials section" />
          <Toggle enabled={settings.showHiringPartners} onChange={(v) => update('showHiringPartners', v)} label="Hiring partners / company logos section" />
        </div>
      </SectionCard>

      {/* Sticky save footer */}
      <div className="sticky bottom-4 flex justify-end">
        <button onClick={save} disabled={saving || !dirty}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-medium rounded-xl shadow-lg transition-colors flex items-center gap-2">
          {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {saving ? 'Saving…' : dirty ? 'Save Changes' : 'All saved'}
        </button>
      </div>
    </div>
  )
}

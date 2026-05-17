'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  Save,
  Search,
} from 'lucide-react';
import type {
  PageSeoListItem,
} from '@/app/api/admin/seo/pages/route';
import type {
  PageSpeedResponse,
  SpeedMetrics,
} from '@/app/api/admin/seo/pagespeed/route';

/* -------------------------------------------------------------------------- */
/*  Shared types                                                              */
/* -------------------------------------------------------------------------- */

interface SeoSettingsDto {
  id?: string;
  googleAnalyticsId?: string | null;
  googleSearchConsoleId?: string | null;
  defaultOgImage?: string | null;
  siteTitle?: string | null;
  twitterHandle?: string | null;
  robotsTxt?: string | null;
}

type Tab = 'pages' | 'settings' | 'speed' | 'tools';

const TABS: ReadonlyArray<{ key: Tab; label: string }> = [
  { key: 'pages', label: 'Pages SEO' },
  { key: 'settings', label: 'Global Settings' },
  { key: 'speed', label: 'Page Speed' },
  { key: 'tools', label: 'Tools' },
];

const SITE_HOST = 'cosscloudsol.com';

/* -------------------------------------------------------------------------- */
/*  Root page                                                                 */
/* -------------------------------------------------------------------------- */

export default function SeoAdminPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('pages');

  // Page data + settings — fetched on mount, shared across tabs for the
  // "SEO Checklist" card so we don't duplicate requests.
  const [pages, setPages] = useState<PageSeoListItem[]>([]);
  const [settings, setSettings] = useState<SeoSettingsDto>({});
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      try {
        const [pagesRes, settingsRes] = await Promise.all([
          fetch('/api/admin/seo/pages', { cache: 'no-store' }),
          fetch('/api/admin/seo/settings', { cache: 'no-store' }),
        ]);
        if (!pagesRes.ok) throw new Error(`pages ${pagesRes.status}`);
        if (!settingsRes.ok) throw new Error(`settings ${settingsRes.status}`);
        const pagesJson = (await pagesRes.json()) as { pages: PageSeoListItem[] };
        const settingsJson = (await settingsRes.json()) as SeoSettingsDto;
        if (!cancelled) {
          setPages(pagesJson.pages);
          setSettings(settingsJson);
        }
      } catch (err) {
        if (!cancelled) {
          setBootError(err instanceof Error ? err.message : 'Failed to load');
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">SEO Manager</h1>
        <p className="mt-1 text-sm text-gray-500">
          Per-page metadata, site-wide SEO settings, page-speed checks, and
          tools.
        </p>
      </header>

      {bootError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {bootError}
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
              tab === t.key
                ? 'bg-teal-600 text-white ring-teal-600'
                : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pages' && (
        <PagesTab
          pages={pages}
          onPagesUpdated={setPages}
        />
      )}
      {tab === 'settings' && (
        <SettingsTab
          settings={settings}
          onSettingsUpdated={setSettings}
        />
      )}
      {tab === 'speed' && <SpeedTab />}
      {tab === 'tools' && <ToolsTab pages={pages} settings={settings} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab 1 — Pages SEO                                                         */
/* -------------------------------------------------------------------------- */

type PageCategory = 'general' | 'courses' | 'blogs';

const GENERAL_SLUGS = new Set([
  'home',
  'courses',
  'about',
  'why-us',
  'contact',
  'corporate-training',
  'placements',
  'certification',
  'student-reviews',
  'blog',
  'enroll-now-with-coss',
  'free-demo-class',
  'privacy-policy',
  'terms-conditions',
]);

function classifyPage(slug: string): PageCategory {
  if (slug.startsWith('blog/') || slug.startsWith('posts/')) return 'blogs';
  if (GENERAL_SLUGS.has(slug)) return 'general';
  return 'courses';
}

const PAGE_CATEGORIES: ReadonlyArray<{ key: PageCategory; label: string; color: string }> = [
  { key: 'general', label: 'General', color: 'teal' },
  { key: 'courses', label: 'Courses', color: 'indigo' },
  { key: 'blogs', label: 'Blogs', color: 'violet' },
];

function PagesTab({
  pages,
  onPagesUpdated,
}: {
  pages: PageSeoListItem[];
  onPagesUpdated: (next: PageSeoListItem[]) => void;
}): JSX.Element {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [pageCategory, setPageCategory] = useState<PageCategory>('general');

  const filteredPages = useMemo(
    () => pages.filter((p) => classifyPage(p.pageSlug) === pageCategory),
    [pages, pageCategory],
  );

  const selectedPage = useMemo(
    () => pages.find((p) => p.pageSlug === selectedSlug) ?? null,
    [pages, selectedSlug],
  );

  const counts = useMemo(() => {
    const c: Record<PageCategory, number> = { general: 0, courses: 0, blogs: 0 };
    for (const p of pages) c[classifyPage(p.pageSlug)]++;
    return c;
  }, [pages]);

  function handleCategoryChange(cat: PageCategory): void {
    setPageCategory(cat);
    setSelectedSlug(null);
  }

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {PAGE_CATEGORIES.map((cat) => {
          const active = pageCategory === cat.key;
          const filledCount = pages.filter(
            (p) => classifyPage(p.pageSlug) === cat.key && (p.metaTitle ?? '').trim() !== '',
          ).length;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => handleCategoryChange(cat.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ring-1 ring-inset transition ${
                active
                  ? cat.key === 'general'
                    ? 'bg-teal-600 text-white ring-teal-600'
                    : cat.key === 'courses'
                      ? 'bg-indigo-600 text-white ring-indigo-600'
                      : 'bg-violet-600 text-white ring-violet-600'
                  : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {filledCount}/{counts[cat.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: page list */}
        <aside className="lg:w-56 lg:shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            {PAGE_CATEGORIES.find((c) => c.key === pageCategory)?.label} Pages
          </p>
          <ul className="space-y-1">
            {pages.length === 0 ? (
              <li className="text-xs text-gray-500">Loading…</li>
            ) : filteredPages.length === 0 ? (
              <li className="text-xs text-gray-500">No pages in this category.</li>
            ) : (
              filteredPages.map((page) => {
                const active = selectedSlug === page.pageSlug;
                const filled = page.metaTitle !== null && page.metaTitle.trim() !== '';
                return (
                  <li key={page.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedSlug(page.pageSlug)}
                      className={`flex w-full items-center justify-between pl-3 pr-3 py-2 rounded-r-lg text-sm cursor-pointer transition ${
                        active
                          ? pageCategory === 'courses'
                            ? 'bg-indigo-50 border-l-2 border-indigo-600 text-indigo-700 font-medium'
                            : pageCategory === 'blogs'
                              ? 'bg-violet-50 border-l-2 border-violet-600 text-violet-700 font-medium'
                              : 'bg-teal-50 border-l-2 border-teal-600 text-teal-700 font-medium'
                          : 'border-l-2 border-transparent hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="truncate">{page.pageTitle}</span>
                      <span
                        className={`shrink-0 inline-block h-2 w-2 rounded-full ${
                          filled ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        {/* Right: form */}
        <section className="flex-1 min-w-0">
          {selectedPage === null ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
              Select a page from the left to edit its SEO.
            </div>
          ) : (
            <PageEditor
              key={selectedPage.id}
              page={selectedPage}
              onSaved={(updated) => {
                onPagesUpdated(
                  pages.map((p) => (p.id === updated.id ? updated : p)),
                );
              }}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function PageEditor({
  page,
  onSaved,
}: {
  page: PageSeoListItem;
  onSaved: (updated: PageSeoListItem) => void;
}): JSX.Element {
  const [metaTitle, setMetaTitle] = useState(page.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(
    page.metaDescription ?? '',
  );
  const [focusKeyword, setFocusKeyword] = useState(page.focusKeyword ?? '');
  const [keywords, setKeywords] = useState(page.keywords ?? '');

  const [ogTitle, setOgTitle] = useState(page.ogTitle ?? '');
  const [ogDescription, setOgDescription] = useState(page.ogDescription ?? '');
  const [ogImage, setOgImage] = useState(page.ogImage ?? '');
  const [ogOpen, setOgOpen] = useState(false);

  const [canonicalUrl, setCanonicalUrl] = useState(page.canonicalUrl ?? '');
  const [noIndex, setNoIndex] = useState(page.noIndex);
  const [noFollow, setNoFollow] = useState(page.noFollow);
  const [schemaMarkup, setSchemaMarkup] = useState(page.schemaMarkup ?? '');
  const [advOpen, setAdvOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState<'ok' | 'err' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [schemaValidation, setSchemaValidation] = useState<
    null | { ok: true } | { ok: false; message: string }
  >(null);

  const titleLen = metaTitle.length;
  const descLen = metaDescription.length;

  async function save(): Promise<void> {
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/seo/pages/${page.pageSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metaTitle,
          metaDescription,
          focusKeyword,
          keywords,
          ogTitle,
          ogDescription,
          ogImage,
          canonicalUrl,
          noIndex,
          noFollow,
          schemaMarkup,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Save failed (${res.status}) ${body}`);
      }
      const updated = (await res.json()) as PageSeoListItem;
      onSaved(updated);
      setSavedFlash('ok');
      setTimeout(() => setSavedFlash(null), 2000);
    } catch (err) {
      console.error('[PageEditor] save failed:', err);
      setSavedFlash('err');
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function validateSchema(): void {
    if (schemaMarkup.trim() === '') {
      setSchemaValidation({ ok: false, message: 'No JSON to validate.' });
      return;
    }
    try {
      JSON.parse(schemaMarkup);
      setSchemaValidation({ ok: true });
    } catch (err) {
      setSchemaValidation({
        ok: false,
        message: err instanceof Error ? err.message : 'Invalid JSON',
      });
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-900">{page.pageTitle}</h2>

      {/* Live Google preview */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-xs uppercase text-gray-400 mb-2">Google Preview</p>
        <p className="text-sm text-green-700">
          {SITE_HOST}/{page.pageSlug === 'home' ? '' : page.pageSlug}
        </p>
        <p className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
          {metaTitle.trim() === ''
            ? 'Page title will appear here'
            : metaTitle}
        </p>
        <p className="text-sm text-gray-600 leading-snug">
          {metaDescription.trim() === ''
            ? 'Meta description will appear here'
            : metaDescription}
        </p>
      </div>

      {/* Basic SEO */}
      <section className="space-y-3">
        <Field label="Meta Title">
          <input
            type="text"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <Counter value={titleLen} max={60} />
        </Field>

        <Field label="Meta Description">
          <textarea
            rows={3}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <Counter value={descLen} max={160} />
        </Field>

        <Field label="Focus Keyword">
          <input
            type="text"
            value={focusKeyword}
            onChange={(e) => setFocusKeyword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Keywords">
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="keyword1, keyword2, keyword3"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </Field>
      </section>

      {/* OG section */}
      <Collapsible
        title="Open Graph / Social Media"
        open={ogOpen}
        onToggle={() => setOgOpen((v) => !v)}
      >
        <Field label="OG Title">
          <input
            type="text"
            value={ogTitle}
            onChange={(e) => setOgTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="OG Description">
          <textarea
            rows={2}
            value={ogDescription}
            onChange={(e) => setOgDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="OG Image URL">
          <input
            type="url"
            value={ogImage}
            onChange={(e) => setOgImage(e.target.value)}
            placeholder="https://…/og-image.jpg"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </Field>
        {ogImage.trim() !== '' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ogImage}
            alt="OG preview"
            className="h-[120px] w-auto rounded object-cover border border-gray-200"
          />
        ) : null}
      </Collapsible>

      {/* Advanced section */}
      <Collapsible
        title="Advanced Settings"
        open={advOpen}
        onToggle={() => setAdvOpen((v) => !v)}
      >
        <Field label="Canonical URL">
          <input
            type="url"
            value={canonicalUrl}
            onChange={(e) => setCanonicalUrl(e.target.value)}
            placeholder={`https://www.${SITE_HOST}/${page.pageSlug}`}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Toggle
            label="No Index"
            helper="Hide from search engines"
            checked={noIndex}
            onChange={setNoIndex}
          />
          <Toggle
            label="No Follow"
            helper="Don't follow links"
            checked={noFollow}
            onChange={setNoFollow}
          />
        </div>

        <Field label="Schema Markup">
          <textarea
            rows={6}
            value={schemaMarkup}
            onChange={(e) => {
              setSchemaMarkup(e.target.value);
              setSchemaValidation(null);
            }}
            placeholder='{"@context": "https://schema.org", ...}'
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={validateSchema}
              className="text-xs rounded-lg border border-gray-300 bg-white px-3 py-1 hover:bg-gray-50"
            >
              Validate JSON
            </button>
            {schemaValidation?.ok === true ? (
              <span className="text-xs text-emerald-600">
                ✓ Valid JSON
              </span>
            ) : null}
            {schemaValidation && schemaValidation.ok === false ? (
              <span className="text-xs text-red-600">
                ✗ {schemaValidation.message}
              </span>
            ) : null}
          </div>
        </Field>
      </Collapsible>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {savedFlash === 'ok' ? (
          <span className="text-sm text-emerald-600">✓ Saved!</span>
        ) : null}
        {savedFlash === 'err' && errorMsg ? (
          <span className="text-sm text-red-600">{errorMsg}</span>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab 2 — Global Settings                                                   */
/* -------------------------------------------------------------------------- */

const DEFAULT_ROBOTS = `User-agent: *
Allow: /
Disallow: /admin/
Sitemap: https://www.cosscloudsol.com/sitemap.xml`;

function SettingsTab({
  settings,
  onSettingsUpdated,
}: {
  settings: SeoSettingsDto;
  onSettingsUpdated: (next: SeoSettingsDto) => void;
}): JSX.Element {
  const [gaId, setGaId] = useState(settings.googleAnalyticsId ?? '');
  const [gscId, setGscId] = useState(settings.googleSearchConsoleId ?? '');
  const [siteTitle, setSiteTitle] = useState(settings.siteTitle ?? '');
  const [twitter, setTwitter] = useState(settings.twitterHandle ?? '');
  const [robotsTxt, setRobotsTxt] = useState(
    settings.robotsTxt ?? DEFAULT_ROBOTS,
  );

  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState<'ok' | 'err' | null>(null);

  // Sync local state if settings prop refreshes (e.g., navigating between tabs).
  useEffect(() => {
    setGaId(settings.googleAnalyticsId ?? '');
    setGscId(settings.googleSearchConsoleId ?? '');
    setSiteTitle(settings.siteTitle ?? '');
    setTwitter(settings.twitterHandle ?? '');
    setRobotsTxt(settings.robotsTxt ?? DEFAULT_ROBOTS);
  }, [settings]);

  async function save(): Promise<void> {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/seo/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleAnalyticsId: gaId,
          googleSearchConsoleId: gscId,
          siteTitle,
          twitterHandle: twitter,
          robotsTxt,
        }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const updated = (await res.json()) as SeoSettingsDto;
      onSettingsUpdated(updated);
      setSavedFlash('ok');
      setTimeout(() => setSavedFlash(null), 2500);
    } catch (err) {
      console.error('[SettingsTab] save failed:', err);
      setSavedFlash('err');
    } finally {
      setSaving(false);
    }
  }

  const gaConnected = gaId.trim().startsWith('G-');

  return (
    <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-5">
      <SettingsSection title="Google Analytics">
        <Field label="Google Analytics 4 ID">
          <input
            type="text"
            value={gaId}
            onChange={(e) => setGaId(e.target.value)}
            placeholder="G-XXXXXXXXXX"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Get from: analytics.google.com → Admin → Data Streams → Measurement
            ID
          </p>
          <span
            className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
              gaConnected
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                : 'bg-gray-50 text-gray-500 ring-gray-200'
            }`}
          >
            ● {gaConnected ? 'Connected' : 'Not configured'}
          </span>
        </Field>
      </SettingsSection>

      <Divider />

      <SettingsSection title="Google Search Console">
        <Field label="Verification Code">
          <input
            type="text"
            value={gscId}
            onChange={(e) => setGscId(e.target.value)}
            placeholder="paste content= value from HTML tag"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            From Search Console → Settings → Ownership verification → HTML tag →
            copy only the content value.
          </p>
        </Field>
      </SettingsSection>

      <Divider />

      <SettingsSection title="Site Identity">
        <Field label="Site Title Suffix">
          <input
            type="text"
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
            placeholder="COSS Cloud Solutions"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Added to all page titles: <code>Courses | COSS Cloud Solutions</code>
          </p>
        </Field>
        <Field label="Twitter Handle">
          <input
            type="text"
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
            placeholder="@cosscloudsol"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </Field>
      </SettingsSection>

      <Divider />

      <SettingsSection title="Robots.txt">
        <Field label="robots.txt content">
          <textarea
            rows={8}
            value={robotsTxt}
            onChange={(e) => setRobotsTxt(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
          />
          <p className="text-xs text-gray-500 mt-1">
            This controls which pages search engines can crawl.
          </p>
        </Field>
      </SettingsSection>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {savedFlash === 'ok' ? (
          <span className="text-sm text-emerald-600">Settings saved!</span>
        ) : null}
        {savedFlash === 'err' ? (
          <span className="text-sm text-red-600">Save failed.</span>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab 3 — Page Speed                                                        */
/* -------------------------------------------------------------------------- */

interface MetricRow {
  key: keyof Pick<SpeedMetrics, 'lcp' | 'fcp' | 'tbt' | 'cls' | 'speedIndex'>;
  label: string;
  rate: (v: string) => 'good' | 'needs' | 'poor';
}

/** Best-effort: extract a leading float from "2.3 s" / "320 ms" / "0.05". */
function parseNumeric(v: string): number {
  const m = v.match(/-?\d+(\.\d+)?/);
  return m === null ? Number.NaN : Number(m[0]);
}

function rateLcp(v: string): 'good' | 'needs' | 'poor' {
  const n = parseNumeric(v);
  if (Number.isNaN(n)) return 'needs';
  return n < 2.5 ? 'good' : n < 4 ? 'needs' : 'poor';
}
function rateFcp(v: string): 'good' | 'needs' | 'poor' {
  const n = parseNumeric(v);
  if (Number.isNaN(n)) return 'needs';
  return n < 1.8 ? 'good' : n < 3 ? 'needs' : 'poor';
}
function rateTbt(v: string): 'good' | 'needs' | 'poor' {
  const n = parseNumeric(v);
  if (Number.isNaN(n)) return 'needs';
  // PSI returns "320 ms" — n is already in ms.
  return n < 200 ? 'good' : n < 600 ? 'needs' : 'poor';
}
function rateCls(v: string): 'good' | 'needs' | 'poor' {
  const n = parseNumeric(v);
  if (Number.isNaN(n)) return 'needs';
  return n < 0.1 ? 'good' : n < 0.25 ? 'needs' : 'poor';
}
function rateSi(v: string): 'good' | 'needs' | 'poor' {
  const n = parseNumeric(v);
  if (Number.isNaN(n)) return 'needs';
  return n < 3.4 ? 'good' : n < 5.8 ? 'needs' : 'poor';
}

const METRICS: ReadonlyArray<MetricRow> = [
  { key: 'lcp', label: 'LCP (Largest Contentful Paint)', rate: rateLcp },
  { key: 'fcp', label: 'FCP (First Contentful Paint)', rate: rateFcp },
  { key: 'tbt', label: 'TBT (Total Blocking Time)', rate: rateTbt },
  { key: 'cls', label: 'CLS (Cumulative Layout Shift)', rate: rateCls },
  { key: 'speedIndex', label: 'Speed Index', rate: rateSi },
];

function SpeedTab(): JSX.Element {
  const [url, setUrl] = useState('https://www.cosscloudsol.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PageSpeedResponse | null>(null);
  const [testedAt, setTestedAt] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function run(): Promise<void> {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/admin/seo/pagespeed?url=${encodeURIComponent(url)}`,
      );
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = (await res.json()) as PageSpeedResponse;
      setResult(json);
      setTestedAt(new Date());
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Test Page Speed</h2>

      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.cosscloudsol.com"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
          {loading ? 'Testing…' : 'Test Speed'}
        </button>
      </div>

      {errorMsg ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      ) : null}

      {result?.mock === true ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">PageSpeed API key not configured.</p>
            <p className="text-xs mt-1">
              Add <code>GOOGLE_PAGESPEED_API_KEY</code> to{' '}
              <code>.env.local</code>. Get a free key at{' '}
              <a
                href="https://console.cloud.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                console.cloud.google.com
              </a>
              .
            </p>
          </div>
        </div>
      ) : null}

      {result && result.mock !== true ? (
        <>
          <div className="flex flex-wrap gap-8 justify-center my-6">
            <ScoreCircle label="Mobile" score={result.mobile.score} />
            <ScoreCircle label="Desktop" score={result.desktop.score} />
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-2.5">Metric</th>
                  <th className="px-5 py-2.5">Mobile</th>
                  <th className="px-5 py-2.5">Desktop</th>
                  <th className="px-5 py-2.5">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {METRICS.map((m) => {
                  const mobileVal = result.mobile[m.key];
                  const desktopVal = result.desktop[m.key];
                  const worst =
                    rankRating(m.rate(mobileVal)) >= rankRating(m.rate(desktopVal))
                      ? m.rate(mobileVal)
                      : m.rate(desktopVal);
                  return (
                    <tr key={m.key}>
                      <td className="px-5 py-3 text-gray-900">{m.label}</td>
                      <td className="px-5 py-3 text-gray-700">{mobileVal}</td>
                      <td className="px-5 py-3 text-gray-700">{desktopVal}</td>
                      <td className="px-5 py-3">{ratingPill(worst)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {testedAt !== null ? (
            <p className="text-xs text-gray-400">
              Tested at {testedAt.toLocaleString()}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function rankRating(r: 'good' | 'needs' | 'poor'): number {
  return r === 'good' ? 0 : r === 'needs' ? 1 : 2;
}
function ratingPill(r: 'good' | 'needs' | 'poor'): JSX.Element {
  if (r === 'good') return <span className="text-emerald-600">● Good</span>;
  if (r === 'needs') return <span className="text-amber-600">▲ Needs Work</span>;
  return <span className="text-red-600">✗ Poor</span>;
}

function ScoreCircle({
  label,
  score,
}: {
  label: string;
  score: number;
}): JSX.Element {
  const tier =
    score >= 90 ? 'good' : score >= 50 ? 'needs' : 'poor';
  const colors =
    tier === 'good'
      ? 'border-emerald-500 text-emerald-600'
      : tier === 'needs'
        ? 'border-amber-500 text-amber-600'
        : 'border-red-500 text-red-600';
  return (
    <div
      className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center ${colors}`}
    >
      <p className="text-2xl font-bold">{score}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab 4 — Tools                                                             */
/* -------------------------------------------------------------------------- */

function ToolsTab({
  pages,
  settings,
}: {
  pages: PageSeoListItem[];
  settings: SeoSettingsDto;
}): JSX.Element {
  const allTitlesSet =
    pages.length > 0 &&
    pages.every((p) => (p.metaTitle ?? '').trim() !== '');
  const allDescsSet =
    pages.length > 0 &&
    pages.every((p) => (p.metaDescription ?? '').trim() !== '');
  const gaConnected = (settings.googleAnalyticsId ?? '').startsWith('G-');
  const gscVerified = (settings.googleSearchConsoleId ?? '').trim() !== '';
  const ogImagesSet = pages.some((p) => (p.ogImage ?? '').trim() !== '');
  const schemaSet = pages.some((p) => (p.schemaMarkup ?? '').trim() !== '');

  const checklist: ReadonlyArray<{ label: string; done: boolean }> = [
    { label: 'Meta titles set for all pages', done: allTitlesSet },
    { label: 'Meta descriptions written', done: allDescsSet },
    { label: 'Google Analytics connected', done: gaConnected },
    { label: 'Search Console verified', done: gscVerified },
    { label: 'Sitemap submitted', done: false },
    { label: 'OG images uploaded', done: ogImagesSet },
    { label: 'Schema markup added', done: schemaSet },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ToolCard
        title="XML Sitemap"
        description="Auto-generated sitemap for all public pages."
      >
        <p className="text-xs text-teal-600">{SITE_HOST}/sitemap.xml</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <ToolLink href="/sitemap.xml" label="View Sitemap" />
          <ToolLink
            href="https://search.google.com/search-console/sitemaps"
            label="Submit to Google"
          />
        </div>
      </ToolCard>

      <ToolCard
        title="Robots.txt"
        description="Controls search engine crawling behavior."
      >
        <p className="text-xs text-teal-600">{SITE_HOST}/robots.txt</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <ToolLink href="/robots.txt" label="View robots.txt" />
        </div>
      </ToolCard>

      <ToolCard
        title="Search Console"
        description="Monitor search performance and indexing."
      >
        <ol className="text-xs text-gray-500 list-decimal list-inside space-y-0.5 mt-1">
          <li>Add GSC verification code in Settings tab</li>
          <li>Submit sitemap URL</li>
          <li>Monitor coverage and performance</li>
        </ol>
        <div className="mt-3">
          <ToolLink
            href="https://search.google.com/search-console"
            label="Open Search Console →"
            color="bg-blue-600"
          />
        </div>
      </ToolCard>

      <ToolCard
        title="Google Analytics 4"
        description="Track visitors, behavior and conversions."
      >
        <ol className="text-xs text-gray-500 list-decimal list-inside space-y-0.5 mt-1">
          <li>Create GA4 property at analytics.google.com</li>
          <li>Copy Measurement ID (G-XXXXXXXXXX)</li>
          <li>Add to Settings tab above</li>
        </ol>
        <div className="mt-3">
          <ToolLink
            href="https://analytics.google.com"
            label="Open Analytics →"
            color="bg-orange-500"
          />
        </div>
      </ToolCard>

      <ToolCard
        title="Schema Markup"
        description="Add structured data for rich search results."
      >
        <p className="text-xs text-gray-500 mt-1">
          Useful types for COSS:{' '}
          <span className="font-medium">
            EducationalOrganization, Course, Review, LocalBusiness, FAQPage
          </span>
        </p>
        <div className="mt-3">
          <ToolLink
            href="https://technicalseo.com/tools/schema-markup-generator"
            label="Schema Generator →"
          />
        </div>
      </ToolCard>

      <ToolCard
        title="SEO Checklist"
        description="Snapshot of what's done across your site."
      >
        <ul className="space-y-1 mt-1">
          {checklist.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              {item.done ? (
                <CheckCircle2
                  className="h-4 w-4 text-emerald-500 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="inline-block h-4 w-4 rounded border border-gray-300 shrink-0"
                  aria-hidden="true"
                />
              )}
              <span className={item.done ? 'text-gray-600' : 'text-gray-700'}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </ToolCard>
    </div>
  );
}

function ToolCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function ToolLink({
  href,
  label,
  color = 'bg-teal-600',
}: {
  href: string;
  label: string;
  color?: string;
}): JSX.Element {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 rounded-lg ${color} hover:brightness-95 text-white text-xs font-semibold px-3 py-1.5`}
    >
      {label}
      <ExternalLink className="h-3 w-3" aria-hidden="true" />
    </a>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shared form sub-components                                                */
/* -------------------------------------------------------------------------- */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function Counter({ value, max }: { value: number; max: number }): JSX.Element {
  const ok = value <= max;
  return (
    <p className={`text-xs mt-1 ${ok ? 'text-emerald-600' : 'text-red-500'}`}>
      {value}/{max}
    </p>
  );
}

function Toggle({
  label,
  helper,
  checked,
  onChange,
}: {
  label: string;
  helper: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}): JSX.Element {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1"
      />
      <span>
        <span className="block text-sm font-medium text-gray-800">{label}</span>
        <span className="block text-xs text-gray-500">{helper}</span>
      </span>
    </label>
  );
}

function Collapsible({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" aria-hidden="true" />
        )}
        {title}
      </button>
      {open ? <div className="border-t border-gray-200 p-4 space-y-3">{children}</div> : null}
    </section>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
        <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
        {title}
      </p>
      {children}
    </div>
  );
}

function Divider(): JSX.Element {
  return <div className="border-t border-gray-100" />;
}

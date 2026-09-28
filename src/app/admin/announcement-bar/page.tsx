'use client';

/**
 * /admin/announcement-bar  (alias: /admin/topbar)
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin panel for the Topbar / Announcement Bar.
 * Lets admins configure: enabled/disabled, announcement text, CTA label,
 * CTA URL, background colour, and text colour — with a live preview and
 * animated success/error toast notification on save.
 *
 * Save → PUT /api/admin/announcement-bar  (full replacement upsert)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Megaphone,
  RotateCcw,
  Save,
  X,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BarConfig {
  id?: string;
  isEnabled: boolean;
  announcementText: string;
  ctaLabel: string;
  ctaUrl: string;
  backgroundColor: string;
  textColor: string;
  updatedAt?: string;
}

type ToastKind = 'success' | 'error';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const DEFAULTS: BarConfig = {
  isEnabled:        false,
  announcementText: 'Upcoming batches filling fast',
  ctaLabel:         'See dates',
  ctaUrl:           '/batches',
  backgroundColor:  '#0f766e',
  textColor:        '#ffffff',
};



// ── Toast portal ──────────────────────────────────────────────────────────────

function ToastPortal({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={[
            'pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3.5 shadow-lg',
            'border text-sm font-medium w-80 max-w-[calc(100vw-2.5rem)]',
            t.kind === 'success'
              ? 'bg-white border-teal-200 text-teal-800'
              : 'bg-white border-red-200 text-red-700',
          ].join(' ')}
          style={{ animation: 'slideUp 0.25s ease-out' }}
        >
          {t.kind === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 text-teal-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 text-red-500 shrink-0" />
          )}
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="shrink-0 opacity-40 hover:opacity-80 transition-opacity mt-0.5"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {/* Slide-up keyframe */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}

// ── Live preview ──────────────────────────────────────────────────────────────

/** Preview of the batches message as the new header strip shows it (site colours). */
function BarPreview({ config }: { config: BarConfig }) {
  if (!config.isEnabled) {
    return (
      <div className="flex items-center justify-center h-12 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-400 dark:text-gray-500 gap-2 select-none">
        <EyeOff className="w-4 h-4" />
        Message hidden: the strip shows only location, Live Online and 5,000+ students
      </div>
    );
  }

  return (
    <div className="flex h-[38px] items-center gap-1.5 overflow-hidden rounded-lg bg-[#0a3d4a] px-4 font-sans text-[13px] text-white">
      <span className="truncate">{config.announcementText || '…'}</span>
      {config.ctaLabel && <span className="shrink-0 font-bold underline underline-offset-2">{config.ctaLabel}</span>}
    </div>
  );
}

// ── Field helpers ─────────────────────────────────────────────────────────────

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-[#475569] dark:text-gray-300 mb-1.5">
      {children}
    </label>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnnouncementBarAdminPage(): JSX.Element {
  const [config,     setConfig]     = useState<BarConfig>(DEFAULTS);
  const [saved,      setSaved]      = useState<BarConfig>(DEFAULTS); // last persisted snapshot
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toasts,     setToasts]     = useState<Toast[]>([]);
  const toastCounter                = useRef(0);

  const isDirty = JSON.stringify(config) !== JSON.stringify(saved);

  /* ── Toast helpers ── */
  const addToast = useCallback((kind: ToastKind, message: string) => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ── Fetch current settings ── */
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/admin/announcement-bar');
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
      const data: BarConfig = await res.json();
      setConfig(data);
      setSaved(data);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  /* ── Field setter ── */
  const set = <K extends keyof BarConfig>(key: K, value: BarConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  /* ── Discard unsaved changes ── */
  const handleReset = () => setConfig(saved);

  /* ── Save via PUT (full replacement upsert) ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/announcement-bar', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled:        config.isEnabled,
          announcementText: config.announcementText,
          ctaLabel:         config.ctaLabel,
          ctaUrl:           config.ctaUrl,
          backgroundColor:  config.backgroundColor,
          textColor:        config.textColor,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(payload?.error ?? `HTTP ${res.status}`);
      }

      const updated: BarConfig = await res.json();
      setConfig(updated);
      setSaved(updated);
      addToast('success', 'Announcement bar settings saved successfully.');
    } catch (err) {
      addToast('error', `Save failed — ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center h-64">
        <Loader2 className="animate-spin text-teal-600 w-6 h-6" />
      </div>
    );
  }

  /* ── Fetch-error state ── */
  if (fetchError) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Failed to load settings</p>
            <p className="text-xs mt-0.5 text-red-500">{fetchError}</p>
          </div>
          <button
            type="button"
            onClick={fetchSettings}
            className="text-xs underline underline-offset-2 hover:text-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── Main render ── */
  return (
    <>
      <ToastPortal toasts={toasts} dismiss={dismissToast} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-6">

          {/* Page heading */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 shrink-0">
                <Megaphone className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#0f172a] dark:text-white leading-tight">
                  Topbar / Announcement Bar
                </h1>
                <p className="text-xs text-[#94a3b8] dark:text-gray-400 mt-0.5">
                  The batches message in the dark strip above the site header: text, then the link (e.g. &ldquo;See dates&rdquo; → /batches). &ldquo;Enable&rdquo; shows or hides this message. The location, Live Online and 5,000+ students parts are fixed; the strip adds &ldquo;· Limited seats&rdquo; by itself when a batch starting in the next 45 days is nearly full, so don&apos;t write &ldquo;limited seats&rdquo; here (it is removed if you do). The strip uses the site colours; the colour settings below no longer apply.
                </p>
              </div>
            </div>

            {/* Live / Hidden badge */}
            <span
              className={[
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mt-1 shrink-0',
                config.isEnabled
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'bg-gray-100 text-gray-500 border border-gray-200',
              ].join(' ')}
            >
              <span
                className={[
                  'w-1.5 h-1.5 rounded-full',
                  config.isEnabled ? 'bg-teal-500 animate-pulse' : 'bg-gray-400',
                ].join(' ')}
              />
              {config.isEnabled ? 'Live' : 'Hidden'}
            </span>
          </div>

          {/* Live preview */}
          <section className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#94a3b8] dark:text-gray-400 uppercase tracking-wide">
              <Eye className="w-3.5 h-3.5" />
              Live preview
            </div>
            <BarPreview config={config} />
            <p className="text-xs text-[#94a3b8] dark:text-gray-500 text-center">
              Real-time preview — updates as you type
            </p>
          </section>

          {/* Settings card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#e2e8f0] dark:border-white/10 shadow-sm divide-y divide-[#f1f5f9] dark:divide-white/5">

            {/* ① Enable / disable */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-[#0f172a] dark:text-gray-100">Enable announcement bar</p>
                <p className="text-xs text-[#94a3b8] dark:text-gray-400 mt-0.5">
                  When off, the bar outputs no HTML — zero CLS, zero layout shift
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={config.isEnabled}
                onClick={() => set('isEnabled', !config.isEnabled)}
                className={[
                  'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
                  config.isEnabled ? 'bg-teal-600' : 'bg-gray-200',
                ].join(' ')}
              >
                <span className="sr-only">Enable announcement bar</span>
                <span
                  className={[
                    'inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200',
                    config.isEnabled ? 'translate-x-6' : 'translate-x-1',
                  ].join(' ')}
                />
              </button>
            </div>

            {/* ② Announcement text */}
            <div className="px-5 py-4">
              <FieldLabel htmlFor="ann-text">Announcement text</FieldLabel>
              <textarea
                id="ann-text"
                rows={2}
                maxLength={200}
                value={config.announcementText}
                onChange={(e) => set('announcementText', e.target.value)}
                placeholder="e.g. Upcoming batches filling fast"
                className="w-full rounded-lg border border-[#e2e8f0] dark:border-white/10 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-[#0f172a] dark:text-gray-100 placeholder-[#94a3b8] dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-[#94a3b8] dark:text-gray-500">Emojis are supported ✨</p>
                <p className={[
                  'text-xs tabular-nums',
                  config.announcementText.length > 180 ? 'text-amber-500 font-medium' : 'text-[#94a3b8] dark:text-gray-500',
                ].join(' ')}>
                  {config.announcementText.length}/200
                </p>
              </div>
            </div>

            {/* ③ CTA Label */}
            <div className="px-5 py-4">
              <FieldLabel htmlFor="cta-label">CTA button label</FieldLabel>
              <input
                id="cta-label"
                type="text"
                maxLength={40}
                value={config.ctaLabel}
                onChange={(e) => set('ctaLabel', e.target.value)}
                placeholder="e.g. Enroll Now"
                className="w-full rounded-lg border border-[#e2e8f0] dark:border-white/10 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-[#0f172a] dark:text-gray-100 placeholder-[#94a3b8] dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
              <p className="text-xs text-[#94a3b8] dark:text-gray-500 mt-1">Leave blank to hide the CTA button.</p>
            </div>

            {/* ④ CTA URL */}
            <div className="px-5 py-4">
              <FieldLabel htmlFor="cta-url">CTA destination URL</FieldLabel>
              <input
                id="cta-url"
                type="text"
                value={config.ctaUrl}
                onChange={(e) => set('ctaUrl', e.target.value)}
                placeholder="e.g. /enroll-now-with-coss/ or https://…"
                className="w-full rounded-lg border border-[#e2e8f0] dark:border-white/10 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-[#0f172a] dark:text-gray-100 placeholder-[#94a3b8] dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
              <p className="text-xs text-[#94a3b8] dark:text-gray-500 mt-1">
                Relative path (e.g.{' '}
                <code className="bg-[#f1f5f9] dark:bg-gray-700 px-1 py-0.5 rounded text-[#475569] dark:text-gray-300">/courses/</code>
                ) or full URL for external links.
              </p>
            </div>

            {/* Colours: kept in the saved record, but the new header strip uses the site colours. */}
            <div className="px-5 py-4">
              <p className="text-sm font-medium text-[#475569] dark:text-gray-300">Colours</p>
              <p className="mt-1 text-xs text-[#94a3b8] dark:text-gray-500">
                Not used by the new header: the strip is always dark teal with white text, so the old colour settings are hidden.
              </p>
            </div>
          </div>

          {/* Footer: Save + Discard + timestamp */}
          <div className="flex items-center justify-between gap-3 pb-6">
            <div className="flex items-center gap-2.5">

              {/* Save button */}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !isDirty}
                className={[
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 shadow-sm',
                  saving
                    ? 'bg-teal-400 text-white cursor-not-allowed'
                    : !isDirty
                    ? 'bg-[#f1f5f9] dark:bg-gray-700 text-[#94a3b8] dark:text-gray-500 cursor-not-allowed border border-[#e2e8f0] dark:border-white/10 shadow-none'
                    : 'bg-teal-600 text-white hover:bg-teal-700 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
                ].join(' ')}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save settings
                  </>
                )}
              </button>

              {/* Discard button — only when there are unsaved changes */}
              {isDirty && !saving && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-[#475569] dark:text-gray-300 border border-[#e2e8f0] dark:border-white/10 bg-white dark:bg-transparent hover:bg-[#f1f5f9] dark:hover:bg-gray-700 hover:text-[#0f172a] dark:hover:text-white transition-all duration-150 active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Discard
                </button>
              )}
            </div>

            {/* Last-saved timestamp */}
            {saved.updatedAt && (
              <p className="text-xs text-[#94a3b8] dark:text-gray-500 hidden sm:block text-right">
                Last saved:{' '}
                <span className="font-medium text-[#475569] dark:text-gray-400">
                  {new Date(saved.updatedAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </p>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

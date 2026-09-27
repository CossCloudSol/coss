'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ImagePicker } from '@/components/admin/ImagePicker';
import PromoBanner from '@/components/PromoBanner';
import {
  PLACEMENT_LABELS,
  PROMO_BANNER_PLACEMENTS,
  promoBannerInputSchema,
  type PromoBannerMetadata,
  type PromoBannerPlacement,
} from '@/lib/promo-banner-schema';

interface BannerRow {
  id: string;
  title: string;
  isVisible: boolean;
  sortOrder: number;
  metadata: PromoBannerMetadata;
  updatedAt: string;
}

interface FormState {
  title: string;
  isVisible: boolean;
  sortOrder: number;
  imageUrl: string;
  mobileImageUrl: string;
  alt: string;
  link: string;
  placement: PromoBannerPlacement;
}

const EMPTY_FORM: FormState = {
  title: '',
  isVisible: true,
  sortOrder: 0,
  imageUrl: '',
  mobileImageUrl: '',
  alt: '',
  link: '/free-demo-class',
  placement: 'course-grid',
};

const input =
  'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30';
const label = 'mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300';

function toForm(row: BannerRow): FormState {
  return {
    title: row.title,
    isVisible: row.isVisible,
    sortOrder: row.sortOrder,
    imageUrl: row.metadata.imageUrl ?? '',
    mobileImageUrl: row.metadata.mobileImageUrl ?? '',
    alt: row.metadata.alt ?? '',
    link: row.metadata.link ?? '',
    placement: row.metadata.placement,
  };
}

function toBody(f: FormState) {
  return {
    title: f.title,
    isVisible: f.isVisible,
    sortOrder: Number.isFinite(f.sortOrder) ? f.sortOrder : 0,
    metadata: { imageUrl: f.imageUrl, mobileImageUrl: f.mobileImageUrl, alt: f.alt, link: f.link, placement: f.placement },
  };
}

async function errorMessage(res: Response): Promise<string> {
  if (res.status === 403) return 'You don’t have permission for this (deleting needs content:delete).';
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export default function PromoBannersPage(): JSX.Element {
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promo-banners', { cache: 'no-store' });
      if (!res.ok) throw new Error(await errorMessage(res));
      const data = (await res.json()) as { banners: BannerRow[] };
      setBanners(data.banners);
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load banners' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(
    () =>
      PROMO_BANNER_PLACEMENTS.map((p) => ({
        placement: p,
        rows: banners.filter((b) => b.metadata.placement === p),
      })),
    [banners],
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startNew() {
    setEditingId('new');
    setForm(EMPTY_FORM);
    setMessage(null);
  }

  function startEdit(row: BannerRow) {
    setEditingId(row.id);
    setForm(toForm(row));
    setMessage(null);
  }

  async function save() {
    const body = toBody(form);
    const check = promoBannerInputSchema.safeParse(body);
    if (!check.success) {
      setMessage({ type: 'error', text: check.error.issues[0]?.message ?? 'Check the form' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const isNew = editingId === 'new';
      const res = await fetch(isNew ? '/api/admin/promo-banners' : `/api/admin/promo-banners/${editingId}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      setMessage({ type: 'ok', text: isNew ? 'Banner created. It appears on the site within a minute.' : 'Banner saved.' });
      setEditingId(null);
      await load();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisible(row: BannerRow) {
    const res = await fetch(`/api/admin/promo-banners/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toBody({ ...toForm(row), isVisible: !row.isVisible })),
    });
    if (!res.ok) setMessage({ type: 'error', text: await errorMessage(res) });
    await load();
  }

  async function remove(row: BannerRow) {
    if (!confirm(`Delete "${row.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/promo-banners/${row.id}`, { method: 'DELETE' });
    if (!res.ok) {
      setMessage({ type: 'error', text: await errorMessage(res) });
      return;
    }
    if (editingId === row.id) setEditingId(null);
    await load();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Promo Banners</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Full-width cards shown after every 6th item in the course and blog grids, below the hero on course pages, and
            after the 2nd section of blog posts. With no banner (or no image), the site shows a coded &quot;Free Demo Class —
            Book Now&quot; card. Images: desktop 4:1 (e.g. 1600×400), mobile 2:1 (e.g. 800×400).
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          + New banner
        </button>
      </div>

      {message && (
        <p
          role="status"
          className={`rounded-lg px-4 py-2 text-sm ${
            message.type === 'ok'
              ? 'bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}
        >
          {message.text}
        </p>
      )}

      {editingId !== null && (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 md:p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {editingId === 'new' ? 'New banner' : 'Edit banner'}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={label} htmlFor="pb-title">Name (admin only)</label>
              <input id="pb-title" className={input} value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div>
              <label className={label} htmlFor="pb-placement">Placement</label>
              <select
                id="pb-placement"
                className={input}
                value={form.placement}
                onChange={(e) => set('placement', e.target.value as PromoBannerPlacement)}
              >
                {PROMO_BANNER_PLACEMENTS.map((p) => (
                  <option key={p} value={p}>{PLACEMENT_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <span className={label}>Desktop image (4:1)</span>
              <ImagePicker value={form.imageUrl} onChange={(url) => set('imageUrl', url)} />
            </div>
            <div>
              <span className={label}>Mobile image (2:1, optional)</span>
              <ImagePicker value={form.mobileImageUrl} onChange={(url) => set('mobileImageUrl', url)} />
            </div>
            <div>
              <label className={label} htmlFor="pb-alt">Alt text (required with an image)</label>
              <input id="pb-alt" className={input} value={form.alt} onChange={(e) => set('alt', e.target.value)} />
            </div>
            <div>
              <label className={label} htmlFor="pb-link">Link (/path or https://…)</label>
              <input id="pb-link" className={input} value={form.link} onChange={(e) => set('link', e.target.value)} />
            </div>
            <div>
              <label className={label} htmlFor="pb-order">Order (lower first; slots cycle through banners)</label>
              <input
                id="pb-order"
                type="number"
                min={0}
                className={input}
                value={form.sortOrder}
                onChange={(e) => set('sortOrder', parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <label className="flex items-center gap-2 self-end text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={form.isVisible} onChange={(e) => set('isVisible', e.target.checked)} />
              Visible on the site
            </label>
          </div>

          <div>
            <span className={label}>Preview</span>
            <PromoBanner
              placement={form.placement}
              banner={{
                id: typeof editingId === 'string' && editingId !== 'new' ? editingId : 'preview',
                imageUrl: form.imageUrl,
                mobileImageUrl: form.mobileImageUrl,
                alt: form.alt || 'Banner preview',
                link: '',
                placement: form.placement,
              }}
              syllabus={form.placement === 'course-page' ? { href: '#', external: false } : undefined}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save banner'}
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        grouped.map(({ placement, rows }) => (
          <section key={placement} className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <h2 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
              {PLACEMENT_LABELS[placement]}
            </h2>
            {rows.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No banners: the coded fallback card is shown.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{row.title}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {row.metadata.imageUrl ? 'Image' : 'No image (fallback card)'} · order {row.sortOrder} ·{' '}
                        {row.isVisible ? 'visible' : 'hidden'} · {row.metadata.link || 'no link'}
                      </p>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <button type="button" onClick={() => startEdit(row)} className="text-teal-700 hover:underline dark:text-teal-400">Edit</button>
                      <button type="button" onClick={() => void toggleVisible(row)} className="text-gray-600 hover:underline dark:text-gray-300">
                        {row.isVisible ? 'Hide' : 'Show'}
                      </button>
                      <button type="button" onClick={() => void remove(row)} className="text-red-600 hover:underline">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      )}
    </div>
  );
}

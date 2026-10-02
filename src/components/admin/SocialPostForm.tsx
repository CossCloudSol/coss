'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CAPTION_LIMIT,
  CHANNEL_LABEL,
  HOOK_MAX,
  IG_MAX_HASHTAGS,
  SOCIAL_CHANNELS,
  channelPayload,
  checkPost,
  normalizeHashtags,
  type SocialChannel,
} from '@/lib/social-captions';

export type SocialPostFormState = {
  content: string;
  channels: Record<SocialChannel, boolean>;
  courseId: string;
  hook: string;
  hashtags: string;
  imageUrl: string;
  imageAltText: string;
  linkUrl: string;
  /** "YYYY-MM-DDTHH:mm", IST wall-clock. */
  scheduledFor: string;
};

export const EMPTY_SOCIAL_POST: SocialPostFormState = {
  content: '',
  channels: { linkedin: true, facebook: false, instagram: false },
  courseId: '',
  hook: '',
  hashtags: '',
  imageUrl: '',
  imageAltText: '',
  linkUrl: '',
  scheduledFor: '',
};

/** The API body for a form state (channels as "linkedin,facebook"). */
export function socialPostBody(form: SocialPostFormState): Record<string, string> {
  return {
    content: form.content,
    channels: SOCIAL_CHANNELS.filter((c) => form.channels[c]).join(','),
    courseId: form.courseId,
    hook: form.hook,
    hashtags: form.hashtags,
    imageUrl: form.imageUrl,
    imageAltText: form.imageAltText,
    linkUrl: form.linkUrl,
    scheduledFor: new Date(`${form.scheduledFor}:00+05:30`).toISOString(),
  };
}

type CourseOption = { id: string; title: string };
type CoursePreview = { courseSlug: string; courseTitle: string; category: string; courseUrl: string; ogImageUrl: string | null; igImageUrl: string | null };

const input = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none disabled:opacity-50';
const card = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5';
const label = 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1';

/** Our absolute URLs shown from this deployment, so previews work before the code is live. */
function sameOrigin(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return /(^|\.)cosscloudsol\.com$/.test(u.hostname) ? `${u.pathname}${u.search}` : url;
  } catch {
    return url;
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function Counter({ length, limit }: { length: number; limit: number }) {
  return (
    <span className={`text-xs tabular-nums ${length > limit ? 'font-semibold text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
      {length.toLocaleString('en-IN')} / {limit.toLocaleString('en-IN')}
    </span>
  );
}

export default function SocialPostForm({
  initial,
  saving,
  submitLabel,
  onSubmit,
}: {
  initial: SocialPostFormState;
  saving: boolean;
  submitLabel: string;
  onSubmit: (form: SocialPostFormState) => void;
}) {
  const [form, setForm] = useState(initial);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [preview, setPreview] = useState<CoursePreview | null>(null);

  function setField<K extends keyof SocialPostFormState>(key: K, value: SocialPostFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    fetch('/api/admin/courses?status=published&limit=500')
      .then((r) => r.json())
      .then((d) => setCourses(((d.courses ?? []) as CourseOption[]).sort((a, b) => a.title.localeCompare(b.title))))
      .catch(() => setCourses([]));
  }, []);

  // Course URL, og:image and the signed Instagram banner for this hook (debounced).
  useEffect(() => {
    if (!form.courseId) {
      setPreview(null);
      return;
    }
    const t = setTimeout(() => {
      const q = new URLSearchParams({ courseId: form.courseId, hook: form.hook.trim() });
      fetch(`/api/admin/social-posts/preview?${q}`)
        .then((r) => (r.ok ? r.json() : null))
        .then(setPreview)
        .catch(() => setPreview(null));
    }, 400);
    return () => clearTimeout(t);
  }, [form.courseId, form.hook]);

  const channels = SOCIAL_CHANNELS.filter((c) => form.channels[c]);
  const draft = { ...form, channels, hasCourse: Boolean(form.courseId) };
  const report = useMemo(() => checkPost(draft), [JSON.stringify(draft)]); // eslint-disable-line react-hooks/exhaustive-deps
  const ctx = preview ?? {};
  const hasImage = form.imageUrl.trim().length > 0;
  const hasLink = form.linkUrl.trim().length > 0;
  const issues = [...report.general, ...channels.flatMap((c) => report.channels[c].map((e) => `${CHANNEL_LABEL[c]}: ${e}`))];
  const hashtagCount = normalizeHashtags(form.hashtags).length;

  function submit() {
    if (!form.content.trim() || !form.scheduledFor) return alert('Post text and a schedule time are required.');
    if (channels.length === 0) return alert('Select at least one channel.');
    onSubmit(form);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-5">
        <div className={card}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Channels</h2>
          <div className="flex flex-wrap gap-5">
            {SOCIAL_CHANNELS.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={form.channels[c]} onChange={(e) => setField('channels', { ...form.channels, [c]: e.target.checked })} className="rounded" />
                {CHANNEL_LABEL[c]}
              </label>
            ))}
          </div>
        </div>

        <div className={card}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Content</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <label className={label}>Post text *</label>
                <span className="flex gap-3">
                  {channels.map((c) => (
                    <span key={c} className="text-xs text-gray-500 dark:text-gray-400">
                      {CHANNEL_LABEL[c]} <Counter length={channelPayload(c, draft, ctx).text.length} limit={CAPTION_LIMIT[c]} />
                    </span>
                  ))}
                </span>
              </div>
              <textarea value={form.content} onChange={(e) => setField('content', e.target.value)} rows={6} className={`${input} resize-y`} />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Allowed claims only: since 2010, 5,000+ students trained, 50+ hiring partners, 1-year LMS access. No guarantees, percentages, rankings or &quot;lifetime&quot;.
              </p>
            </div>
            <div>
              <label className={label}>Course {form.channels.facebook || form.channels.instagram ? '(Facebook links to it; Instagram uses its banner)' : '(optional)'}</label>
              <select value={form.courseId} onChange={(e) => setField('courseId', e.target.value)} className={input}>
                <option value="">— No course —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            {form.channels.instagram && (
              <>
                <div>
                  <div className="flex items-baseline justify-between">
                    <label className={label}>Instagram hook line (on the image)</label>
                    <Counter length={form.hook.trim().length} limit={HOOK_MAX} />
                  </div>
                  <input type="text" value={form.hook} onChange={(e) => setField('hook', e.target.value)} placeholder="e.g. Build and ship pipelines on real AWS projects" className={input} />
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <label className={label}>Instagram hashtags</label>
                    <Counter length={hashtagCount} limit={IG_MAX_HASHTAGS} />
                  </div>
                  <input type="text" value={form.hashtags} onChange={(e) => setField('hashtags', e.target.value)} placeholder="#DevOps #AWS #Hyderabad" className={input} />
                </div>
              </>
            )}
          </div>
        </div>

        {form.channels.linkedin && (
          <div className={card}>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">LinkedIn media (choose one)</h2>
            <div className="space-y-4">
              <div>
                <label className={label}>Image URL</label>
                <input type="text" value={form.imageUrl} onChange={(e) => setField('imageUrl', e.target.value)} disabled={hasLink} placeholder="https://..." className={input} />
              </div>
              {hasImage && (
                <div>
                  <label className={label}>Image alt text *</label>
                  <input type="text" value={form.imageAltText} onChange={(e) => setField('imageAltText', e.target.value)} placeholder="Required by Buffer for every image" className={input} />
                </div>
              )}
              <div>
                <label className={label}>Link URL</label>
                <input type="text" value={form.linkUrl} onChange={(e) => setField('linkUrl', e.target.value)} disabled={hasImage} placeholder="https://..." className={input} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">An image and a link cannot both be set. Links to cosscloudsol.com get UTM tags.</p>
              </div>
            </div>
          </div>
        )}

        <div className={card}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Schedule</h2>
          <label className={label}>Scheduled for (IST) *</label>
          <input type="datetime-local" value={form.scheduledFor} onChange={(e) => setField('scheduledFor', e.target.value)} className={input} />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Saved as a draft. Nothing goes to Buffer until an admin clicks &quot;Approve &amp; schedule&quot; in the list.</p>
        </div>

        {issues.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
            <p className="font-semibold mb-1">Fix before approving:</p>
            <ul className="list-disc pl-5 space-y-0.5">
              {issues.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={submit} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 hover:opacity-90" style={{ background: '#0f766e' }}>
            {saving ? 'Saving...' : submitLabel}
          </button>
          <Link href="/admin/social-posts" className="flex-1 py-3 rounded-xl text-sm font-medium text-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </Link>
        </div>
      </div>

      {/* Previews: what each network will receive. */}
      <div className="space-y-5">
        {channels.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Select a channel to see its preview.</p>}
        {channels.map((c) => {
          const p = channelPayload(c, draft, ctx);
          return (
            <div key={c} className={card} data-preview={c}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{CHANNEL_LABEL[c]} preview</h2>
                <Counter length={p.text.length} limit={CAPTION_LIMIT[c]} />
              </div>
              {c === 'instagram' && (
                <div className="mb-3 aspect-[4/5] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
                  {sameOrigin(p.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sameOrigin(p.imageUrl) as string} alt={p.imageAltText ?? ''} className="h-full w-full object-cover" />
                  ) : (
                    <p className="flex h-full items-center justify-center p-6 text-center text-xs text-gray-500">Choose a course and add a hook to generate the 1080×1350 image.</p>
                  )}
                </div>
              )}
              {c === 'instagram' && p.imageUrl && (
                <p className="-mt-1 mb-3 text-[11px] text-gray-500 dark:text-gray-400">Sent to Instagram as a JPEG (converted via Cloudinary at send time).</p>
              )}
              <p className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200">{p.text || <span className="text-gray-400">Post text…</span>}</p>
              {c !== 'instagram' && p.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt={p.imageAltText ?? ''} className="mt-3 w-full rounded-lg" />
              )}
              {c !== 'instagram' && p.linkUrl && (
                <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  {c === 'facebook' && sameOrigin(preview?.ogImageUrl) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sameOrigin(preview?.ogImageUrl) as string} alt="" className="aspect-[2/1] w-full object-cover" />
                  )}
                  <div className="bg-gray-50 p-3 dark:bg-gray-900">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500">{hostOf(p.linkUrl)}</p>
                    {preview && c === 'facebook' && <p className="text-sm font-semibold text-gray-900 dark:text-white">{preview.courseTitle}</p>}
                    <p className="mt-1 break-all text-[11px] text-gray-500">{p.linkUrl}</p>
                  </div>
                </div>
              )}
              {report.channels[c].length > 0 && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{report.channels[c].join(' ')}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

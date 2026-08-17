'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Loader2,
  MessageCircle,
  Phone,
  Send,
  X,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Public types — mirror app/api/admin/leads/[id]/route.ts                   */
/* -------------------------------------------------------------------------- */

export interface LeadActivityItem {
  id: string;
  action: string;
  note: string;
  createdAt: string;
}

export interface LeadDetail {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  course: string | null;
  branch: string;
  formType: string;
  status: string;
  message: string | null;
  createdAt: string;
  activities: LeadActivityItem[];
}

interface LeadDrawerProps {
  leadId: string | null;
  onClose: () => void;
  /** Called after a successful status update so the parent list can refresh. */
  onStatusChanged?: (leadId: string, nextStatus: string) => void;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const STATUS_OPTIONS = ['new', 'contacted', 'enrolled', 'lost'] as const;
type Status = (typeof STATUS_OPTIONS)[number];

const STATUS_LABEL: Record<Status, string> = {
  new: 'New',
  contacted: 'Contacted',
  enrolled: 'Enrolled',
  lost: 'Lost',
};

const STATUS_STYLES: Record<Status, { pill: string; dot: string }> = {
  new: { pill: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' },
  contacted: {
    pill: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
  },
  enrolled: {
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  lost: { pill: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
};

interface ActivityMeta {
  dot: string;
  label: string;
}

const ACTIVITY_META: Record<string, ActivityMeta> = {
  whatsapp_sent: { dot: 'bg-emerald-500', label: 'WhatsApp sent' },
  status_changed: { dot: 'bg-blue-500', label: 'Status updated' },
  note: { dot: 'bg-gray-400', label: 'Note added' },
  called: { dot: 'bg-purple-500', label: 'Called' },
};

const MAX_NOTE_LENGTH = 2000;

function isStatus(value: string): value is Status {
  return (STATUS_OPTIONS as ReadonlyArray<string>).includes(value);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** wa.me expects digits only (with country code prefix). */
function toWhatsAppNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/* -------------------------------------------------------------------------- */
/*  Root                                                                      */
/* -------------------------------------------------------------------------- */

export default function LeadDrawer({
  leadId,
  onClose,
  onStatusChanged,
}: LeadDrawerProps): JSX.Element | null {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [visible, setVisible] = useState(false);

  /* ----------------------------- Slide-in ------------------------------- */
  // Two-frame technique: render off-screen first, then swap to on-screen so
  // the CSS transition has a target to animate toward.
  useEffect(() => {
    if (!leadId) {
      setVisible(false);
      return;
    }
    setVisible(false);
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [leadId]);

  /* ----------------------------- Fetch ---------------------------------- */
  useEffect(() => {
    if (!leadId) {
      setLead(null);
      setError(null);
      setNoteDraft('');
      return;
    }
    const controller = new AbortController();
    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      setNoteDraft('');
      setLead(null);
      try {
        const res = await fetch(`/api/admin/leads/${leadId}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!res.ok) {
          throw new Error(
            res.status === 404 ? 'Lead not found' : `Load failed (${res.status})`,
          );
        }
        const data = (await res.json()) as LeadDetail;
        if (!cancelled) setLead(data);
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return;
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Load failed');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [leadId]);

  /* ----------------------------- Esc to close --------------------------- */
  useEffect(() => {
    if (!leadId) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [leadId, onClose]);

  /* ----------------------------- Body scroll lock ----------------------- */
  useEffect(() => {
    if (!leadId) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [leadId]);

  /* ----------------------------- Mutations ------------------------------ */

  const changeStatus = useCallback(
    async (nextStatus: Status): Promise<void> => {
      if (!lead) return;
      const prevStatus = lead.status;
      setUpdatingStatus(true);
      setLead({ ...lead, status: nextStatus }); // optimistic

      try {
        const res = await fetch(`/api/admin/leads/${lead.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (!res.ok) throw new Error(`PATCH failed (${res.status})`);
        const fresh = (await res.json()) as LeadDetail;
        setLead(fresh);
        onStatusChanged?.(lead.id, nextStatus);
      } catch {
        // Rollback on failure.
        setLead({ ...lead, status: prevStatus });
      } finally {
        setUpdatingStatus(false);
      }
    },
    [lead, onStatusChanged],
  );

  const saveNote = useCallback(async (): Promise<void> => {
    if (!lead) return;
    const trimmed = noteDraft.trim();
    if (trimmed === '') return;

    const optimistic: LeadActivityItem = {
      id: `temp-${Date.now()}`,
      action: 'note',
      note: trimmed,
      createdAt: new Date().toISOString(),
    };
    const prevActivities = lead.activities;

    setSavingNote(true);
    setLead({ ...lead, activities: [optimistic, ...prevActivities] });
    setNoteDraft('');

    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: trimmed }),
      });
      if (!res.ok) throw new Error(`PATCH failed (${res.status})`);
      const fresh = (await res.json()) as LeadDetail;
      setLead(fresh);
    } catch {
      // Rollback: drop optimistic entry and restore the draft so the user can
      // retry without re-typing.
      setLead((curr) =>
        curr
          ? { ...curr, activities: prevActivities }
          : curr,
      );
      setNoteDraft(trimmed);
    } finally {
      setSavingNote(false);
    }
  }, [lead, noteDraft]);

  // Fire-and-forget: must never delay opening wa.me / the dialer, so this is
  // not awaited by the click handler. The server route awaits its own write.
  const recordWhatsappSent = useCallback((): void => {
    if (!lead) return;
    fetch(`/api/admin/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsappSent: true }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`PATCH failed (${res.status})`);
      })
      .catch((err) => {
        console.warn('[LeadDrawer] Failed to record whatsapp_sent activity:', err);
      });
  }, [lead]);

  const recordCalled = useCallback((): void => {
    if (!lead) return;
    fetch(`/api/admin/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ called: true }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`PATCH failed (${res.status})`);
      })
      .catch((err) => {
        console.warn('[LeadDrawer] Failed to record called activity:', err);
      });
  }, [lead]);

  /* ----------------------------- Render --------------------------------- */

  if (!leadId) return null;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      {/* Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Lead details"
        className={`absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-white dark:bg-gray-800 shadow-2xl transition-transform duration-200 ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close drawer"
          className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-gray-400 dark:text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        {loading ? (
          <DrawerSkeleton />
        ) : error ? (
          <ErrorBody message={error} />
        ) : lead ? (
          <>
            <DrawerHeader
              lead={lead}
              updating={updatingStatus}
              onChangeStatus={changeStatus}
              onWhatsappClick={recordWhatsappSent}
              onCallClick={recordCalled}
            />
            <div className="flex-1 overflow-y-auto px-5 pb-8">
              <DetailsGrid lead={lead} />
              {lead.message ? <MessageSection message={lead.message} /> : null}
              <NoteComposer
                value={noteDraft}
                onChange={setNoteDraft}
                saving={savingNote}
                onSave={saveNote}
              />
              <ActivityLog activities={lead.activities} />
            </div>
          </>
        ) : null}
      </aside>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Header                                                                    */
/* -------------------------------------------------------------------------- */

function DrawerHeader({
  lead,
  updating,
  onChangeStatus,
  onWhatsappClick,
  onCallClick,
}: {
  lead: LeadDetail;
  updating: boolean;
  onChangeStatus: (s: Status) => void;
  onWhatsappClick: () => void;
  onCallClick: () => void;
}): JSX.Element {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Click-outside to close the status picker.
  useEffect(() => {
    if (!pickerOpen) return;
    function onDocClick(e: MouseEvent): void {
      const target = e.target as Node | null;
      if (!target) return;
      if (pickerRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setPickerOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [pickerOpen]);

  const statusKey: Status = isStatus(lead.status.toLowerCase())
    ? (lead.status.toLowerCase() as Status)
    : 'new';
  const style = STATUS_STYLES[statusKey];
  const waNumber = toWhatsAppNumber(lead.phone);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 p-5 pr-12">
      <div className="flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-600 text-lg font-bold text-white"
          aria-hidden="true"
        >
          {getInitials(lead.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
            {lead.name}
          </h2>
          <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">{lead.phone}</p>

          <div className="relative mt-2 inline-block">
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              disabled={updating}
              aria-haspopup="menu"
              aria-expanded={pickerOpen}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset transition hover:brightness-95 disabled:opacity-60 ${style.pill}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                aria-hidden="true"
              />
              {STATUS_LABEL[statusKey]}
              {updating ? (
                <Loader2
                  className="ml-1 h-3 w-3 animate-spin"
                  aria-hidden="true"
                />
              ) : null}
            </button>

            {pickerOpen ? (
              <div
                ref={pickerRef}
                role="menu"
                className="absolute left-0 top-full z-10 mt-1 w-40 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 shadow-lg"
              >
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setPickerOpen(false);
                      onChangeStatus(s);
                    }}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      s === statusKey
                        ? 'bg-gray-50 dark:bg-gray-700 font-semibold text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLES[s].dot}`}
                      aria-hidden="true"
                    />
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onWhatsappClick}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          WhatsApp
        </a>
        <a
          href={`tel:${lead.phone}`}
          onClick={onCallClick}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          Call
        </a>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Body sections                                                             */
/* -------------------------------------------------------------------------- */

function DetailsGrid({ lead }: { lead: LeadDetail }): JSX.Element {
  const submitted = new Date(lead.createdAt).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const inquiryType = lead.course ? 'Course Inquiry' : 'General';

  return (
    <section className="mt-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Lead Details
      </h3>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
        <DetailItem label="Email" value={lead.email ?? '—'} />
        <DetailItem label="Course" value={lead.course ?? '—'} />
        <DetailItem label="Branch" value={lead.branch} capitalize />
        <DetailItem label="Inquiry Type" value={inquiryType} />
        <DetailItem label="Form Source" value={lead.formType} capitalize />
        <DetailItem label="Submitted" value={submitted} />
      </dl>
    </section>
  );
}

function DetailItem({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}): JSX.Element {
  return (
    <div>
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd
        className={`mt-0.5 break-words text-sm text-gray-900 dark:text-gray-100 ${
          capitalize ? 'capitalize' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function MessageSection({ message }: { message: string }): JSX.Element {
  return (
    <section className="mt-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Message
      </h3>
      <p className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 text-sm text-gray-700 dark:text-gray-300">
        {message}
      </p>
    </section>
  );
}

function NoteComposer({
  value,
  onChange,
  saving,
  onSave,
}: {
  value: string;
  onChange: (v: string) => void;
  saving: boolean;
  onSave: () => void;
}): JSX.Element {
  const canSave = value.trim() !== '' && !saving;

  return (
    <section className="mt-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Add Note
      </h3>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add a note about this lead…"
        rows={3}
        maxLength={MAX_NOTE_LENGTH}
        aria-label="Note"
        className="mt-2 w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {value.length}/{MAX_NOTE_LENGTH}
        </p>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
          Save Note
        </button>
      </div>
    </section>
  );
}

function ActivityLog({
  activities,
}: {
  activities: LeadActivityItem[];
}): JSX.Element {
  return (
    <section className="mt-6">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Activity Log
      </h3>
      {activities.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-4 text-center text-xs text-gray-500 dark:text-gray-400">
          No activity yet. Status changes and notes will show up here.
        </p>
      ) : (
        <ol
          className="relative mt-3 space-y-4 before:absolute before:left-[5px] before:top-1 before:h-[calc(100%-0.25rem)] before:w-px before:bg-gray-200 dark:before:bg-gray-700"
        >
          {activities.map((activity) => {
            const meta =
              ACTIVITY_META[activity.action] ?? {
                dot: 'bg-gray-400',
                label: activity.action.replace(/_/g, ' '),
              };
            return (
              <li key={activity.id} className="relative pl-6">
                <span
                  className={`absolute left-0 top-[5px] h-3 w-3 rounded-full ring-2 ring-white dark:ring-gray-800 ${meta.dot}`}
                  aria-hidden="true"
                />
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  {meta.label}
                </p>
                <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{activity.note}</p>
                <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading / error                                                           */
/* -------------------------------------------------------------------------- */

function DrawerSkeleton(): JSX.Element {
  return (
    <div className="flex-1 space-y-5 p-5">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
      <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
      <div className="h-32 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
      <div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
      <div className="h-48 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
    </div>
  );
}

function ErrorBody({ message }: { message: string }): JSX.Element {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-center">
        <p className="text-sm font-medium text-red-700">Couldn&apos;t load lead</p>
        <p className="mt-1 text-xs text-red-600">{message}</p>
      </div>
    </div>
  );
}

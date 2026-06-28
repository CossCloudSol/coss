'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Briefcase,
  Download,
  Eye,
  Loader2,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type {
  AdminCorporateLeadItem,
  AdminCorporateLeadsListResponse,
} from '@/app/api/admin/corporate/route';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const STATUS_OPTIONS = ['new', 'reviewing', 'sent', 'won', 'lost'] as const;
type Status = (typeof STATUS_OPTIONS)[number];

const STATUS_LABEL: Record<Status, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  sent: 'Sent',
  won: 'Won',
  lost: 'Lost',
};

const STATUS_STYLES: Record<Status, { pill: string; dot: string }> = {
  new: { pill: 'bg-[#dcfce7] text-[#15803d] ring-[#bbf7d0] dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-700', dot: 'bg-emerald-500' },
  reviewing: {
    pill: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-700',
    dot: 'bg-amber-500',
  },
  sent: {
    pill: 'bg-[#dbeafe] text-[#1d4ed8] ring-[#bfdbfe] dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-700',
    dot: 'bg-blue-500',
  },
  won: {
    pill: 'bg-[#f3e8ff] text-[#7c3aed] ring-[#e9d5ff] dark:bg-purple-900/30 dark:text-purple-400 dark:ring-purple-700',
    dot: 'bg-purple-500',
  },
  lost: { pill: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-700', dot: 'bg-red-500' },
};

const SEARCH_DEBOUNCE_MS = 400;

function isStatus(value: string): value is Status {
  return (STATUS_OPTIONS as ReadonlyArray<string>).includes(value);
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function CorporateLeadsPage(): JSX.Element {
  const [leads, setLeads] = useState<AdminCorporateLeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state. `searchInput` updates instantly so typing is responsive;
  // `searchDebounced` is used for actual filtering, lagging by 400ms.
  const [searchInput, setSearchInput] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | Status>('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal: which lead is open. `null` means closed.
  const [modalLeadId, setModalLeadId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  /* ----------------------------- Fetch ---------------------------------- */
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/corporate', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }
        const data = (await res.json()) as AdminCorporateLeadsListResponse;
        if (!cancelled) setLeads(data.leads);
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return;
        if (!cancelled) {
          console.error('[CorporatePage] GET failed:', err);
          setError(
            err instanceof Error ? err.message : 'Failed to load leads',
          );
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
  }, []);

  /* ----------------------------- Search debounce ------------------------ */
  const onSearchChange = (value: string): void => {
    setSearchInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchDebounced(value.trim().toLowerCase());
    }, SEARCH_DEBOUNCE_MS);
  };

  /* ----------------------------- Derived state -------------------------- */
  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let thisMonth = 0;
    let pendingReview = 0;
    for (const lead of leads) {
      const created = new Date(lead.createdAt);
      if (created >= startOfMonth) thisMonth += 1;
      const s = lead.status.toLowerCase();
      if (s === 'new' || s === 'reviewing') pendingReview += 1;
    }
    return { total: leads.length, thisMonth, pendingReview };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const search = searchDebounced;
    return leads.filter((lead) => {
      // Status filter
      if (statusFilter !== '' && lead.status.toLowerCase() !== statusFilter) {
        return false;
      }
      // Search filter — company / contact / email
      if (search !== '') {
        const haystack = `${lead.companyName} ${lead.contactPerson} ${lead.email}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }, [leads, statusFilter, searchDebounced]);

  const modalLead = useMemo(
    () => (modalLeadId ? leads.find((l) => l.id === modalLeadId) ?? null : null),
    [modalLeadId, leads],
  );

  /* ----------------------------- Mutations ------------------------------ */
  async function updateStatus(id: string, nextStatus: Status): Promise<void> {
    const prev = leads;
    setUpdatingStatus(true);
    setLeads((curr) =>
      curr.map((l) => (l.id === id ? { ...l, status: nextStatus } : l)),
    );
    try {
      const res = await fetch(`/api/admin/corporate/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error(`PATCH failed (${res.status})`);
    } catch (err) {
      console.error('[CorporatePage] PATCH failed:', err);
      setLeads(prev); // rollback
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function deleteLead(id: string): Promise<void> {
    if (!window.confirm('Delete this corporate lead?')) return;
    const prev = leads;
    setLeads((curr) => curr.filter((l) => l.id !== id));
    if (modalLeadId === id) setModalLeadId(null);
    try {
      const res = await fetch(`/api/admin/corporate/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) {
        throw new Error(`DELETE failed (${res.status})`);
      }
    } catch (err) {
      console.error('[CorporatePage] DELETE failed:', err);
      setLeads(prev); // rollback
    }
  }

  /* ----------------------------- Render --------------------------------- */
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Corporate Leads</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Proposal requests from the corporate-training enquiry form.
        </p>
      </header>

      {/* Stats row -------------------------------------------------------- */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 sm:col-span-4">
          <StatCard label="Total Proposals" value={stats.total} accent="blue" />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <StatCard
            label="This Month"
            value={stats.thisMonth}
            accent="green"
          />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <StatCard
            label="Pending Review"
            value={stats.pendingReview}
            accent="orange"
          />
        </div>
      </div>

      {/* Error banner ---------------------------------------------------- */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Filter bar ------------------------------------------------------- */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search company, contact, email…"
              aria-label="Search corporate leads"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportCorporateLeadsCsv(filteredLeads)}
              disabled={filteredLeads.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <StatusPill
            active={statusFilter === ''}
            label="All"
            onClick={() => setStatusFilter('')}
          />
          {STATUS_OPTIONS.map((s) => (
            <StatusPill
              key={s}
              active={statusFilter === s}
              label={STATUS_LABEL[s]}
              onClick={() => setStatusFilter(s)}
            />
          ))}
        </div>
      </div>

      {/* Table ------------------------------------------------------------ */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <th scope="col" className="w-10 px-4 py-2.5">
                #
              </th>
              <th scope="col" className="px-4 py-2.5">
                Company
              </th>
              <th scope="col" className="px-4 py-2.5">
                Contact Person
              </th>
              <th scope="col" className="px-4 py-2.5">
                Phone + Email
              </th>
              <th scope="col" className="px-4 py-2.5">
                Domain
              </th>
              <th scope="col" className="px-4 py-2.5">
                Team Size
              </th>
              <th scope="col" className="px-4 py-2.5">
                Status
              </th>
              <th scope="col" className="px-4 py-2.5">
                Date
              </th>
              <th scope="col" className="px-4 py-2.5 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {loading ? (
              <SkeletonRows />
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-14">
                  <EmptyState />
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead, i) => (
                <CorporateRow
                  key={lead.id}
                  lead={lead}
                  index={i + 1}
                  onView={setModalLeadId}
                  onDelete={deleteLead}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Yearly sparkline ------------------------------------------------- */}
      <MonthlySparkline leads={leads} />

      {/* Detail modal ----------------------------------------------------- */}
      {modalLead ? (
        <DetailModal
          lead={modalLead}
          updatingStatus={updatingStatus}
          onClose={() => setModalLeadId(null)}
          onChangeStatus={(status) => updateStatus(modalLead.id, status)}
        />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

type AccentColor = 'blue' | 'green' | 'orange';

const ACCENT_BAR: Record<AccentColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  orange: 'bg-orange-500',
};

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: AccentColor;
}): JSX.Element {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div
        className={`absolute left-0 top-0 h-1 w-full ${ACCENT_BAR[accent]}`}
        aria-hidden="true"
      />
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function StatusPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
        active
          ? 'bg-teal-600 text-white ring-teal-600'
          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 ring-gray-200 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );
}

function CorporateRow({
  lead,
  index,
  onView,
  onDelete,
}: {
  lead: AdminCorporateLeadItem;
  index: number;
  onView: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}): JSX.Element {
  const statusKey: Status = isStatus(lead.status.toLowerCase())
    ? (lead.status.toLowerCase() as Status)
    : 'new';
  const statusStyle = STATUS_STYLES[statusKey];

  return (
    <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-700/40">
      <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">{index}</td>

      <td className="px-4 py-3">
        <p className="font-semibold text-gray-900 dark:text-white">{lead.companyName}</p>
        <span className="mt-1 inline-flex rounded-full bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 text-[11px] font-medium text-teal-700 dark:text-teal-300 ring-1 ring-inset ring-teal-200 dark:ring-teal-700">
          {lead.trainingDomain}
        </span>
      </td>

      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.contactPerson}</td>

      <td className="px-4 py-3">
        <p className="font-medium text-gray-900 dark:text-white">{lead.phone}</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{lead.email}</p>
      </td>

      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.trainingDomain}</td>

      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.employeeCount}</td>

      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${statusStyle.pill}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
            aria-hidden="true"
          />
          {STATUS_LABEL[statusKey]}
        </span>
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
        {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <IconButton
            label="View details"
            icon={<Eye className="h-4 w-4" />}
            onClick={() => onView(lead.id)}
          />
          <IconButton
            label="Delete"
            icon={<Trash2 className="h-4 w-4" />}
            variant="danger"
            onClick={() => {
              void onDelete(lead.id);
            }}
          />
        </div>
      </td>
    </tr>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  variant = 'default',
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded-md p-1.5 transition ${
        variant === 'danger'
          ? 'text-gray-400 hover:bg-red-50 hover:text-red-600'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {icon}
    </button>
  );
}

function SkeletonRows(): JSX.Element {
  // Three placeholder rows while the GET resolves.
  return (
    <>
      {[0, 1, 2].map((i) => (
        <tr key={i}>
          <td colSpan={9} className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-3 w-6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 flex-1 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

function EmptyState(): JSX.Element {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-4 text-gray-400 dark:text-gray-500">
        <Briefcase className="h-8 w-8" aria-hidden="true" />
      </div>
      <p className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
        No corporate leads yet
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Submissions from the corporate-training enquiry form will appear here.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Detail modal (inline)                                                     */
/* -------------------------------------------------------------------------- */

function DetailModal({
  lead,
  updatingStatus,
  onClose,
  onChangeStatus,
}: {
  lead: AdminCorporateLeadItem;
  updatingStatus: boolean;
  onClose: () => void;
  onChangeStatus: (status: Status) => void;
}): JSX.Element {
  // Esc to close + body scroll lock.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = original;
    };
  }, [onClose]);

  const statusKey: Status = isStatus(lead.status.toLowerCase())
    ? (lead.status.toLowerCase() as Status)
    : 'new';
  const submitted = new Date(lead.createdAt).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Corporate lead — ${lead.companyName}`}
        className="relative w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 shadow-2xl"
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {lead.companyName}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Corporate lead · submitted {submitted}
          </p>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <DetailItem label="Company" value={lead.companyName} />
            <DetailItem label="Contact Person" value={lead.contactPerson} />
            <DetailItem label="Phone" value={lead.phone} />
            <DetailItem label="Email" value={lead.email} />
            <DetailItem label="Training Domain" value={lead.trainingDomain} />
            <DetailItem label="Team Size" value={lead.employeeCount} />
            <DetailItem label="Date submitted" value={submitted} />
            <div>
              <dt className="text-xs text-gray-500 dark:text-gray-400">Status</dt>
              <dd className="mt-1">
                <select
                  value={statusKey}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (isStatus(next)) onChangeStatus(next);
                  }}
                  disabled={updatingStatus}
                  aria-label="Update status"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-1.5 pl-2.5 pr-8 text-sm text-gray-900 dark:text-gray-100 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-60"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </dd>
            </div>
          </dl>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-700 px-5 py-3">
          {updatingStatus ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Saving…
            </span>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}): JSX.Element {
  return (
    <div>
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Yearly volume sparkline                                                   */
/* -------------------------------------------------------------------------- */

const MONTH_LABELS: ReadonlyArray<string> = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function MonthlySparkline({
  leads,
}: {
  leads: AdminCorporateLeadItem[];
}): JSX.Element {
  // Always render 12 buckets so the chart shape is consistent year-to-year.
  // We bucket only the current calendar year — older submissions are excluded
  // from the chart but the table above still shows them.
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  const counts: number[] = Array.from({ length: 12 }, () => 0);
  for (const lead of leads) {
    const created = new Date(lead.createdAt);
    if (created.getFullYear() === currentYear) {
      counts[created.getMonth()] += 1;
    }
  }

  const max = Math.max(...counts, 1);
  const total = counts.reduce((sum, c) => sum + c, 0);

  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">This year</h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Corporate proposals by month
          </p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Total:{' '}
          <span className="font-semibold text-gray-900 dark:text-white">
            {total.toLocaleString()}
          </span>
        </p>
      </header>

      <div className="mt-6 grid h-[140px] grid-cols-12 items-end gap-2">
        {counts.map((count, i) => {
          const heightPercent = (count / max) * 100;
          const isCurrent = i === currentMonth;
          return (
            <div
              key={`bar-${i}`}
              className={`w-full rounded-t-sm transition-all ${
                isCurrent ? 'bg-teal-700' : 'bg-teal-500'
              }`}
              style={{
                // CSS max() guarantees the 4px baseline even for empty months,
                // so the chart never collapses to a flat row.
                height:
                  count === 0
                    ? '4px'
                    : `max(4px, ${heightPercent.toFixed(2)}%)`,
                opacity: count === 0 ? 0.3 : 1,
              }}
              aria-hidden="true"
            />
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-12 gap-2">
        {counts.map((count, i) => {
          const isCurrent = i === currentMonth;
          return (
            <div key={`label-${i}`} className="text-center">
              <p
                className={`text-sm text-gray-900 dark:text-white ${
                  isCurrent ? 'font-bold' : 'font-semibold'
                }`}
              >
                {count}
              </p>
              <p
                className={`text-[10px] ${
                  isCurrent ? 'font-bold text-teal-700 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {MONTH_LABELS[i]}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  CSV export                                                                */
/* -------------------------------------------------------------------------- */

const CSV_HEADERS: ReadonlyArray<string> = [
  '#',
  'Company',
  'Contact Person',
  'Phone',
  'Email',
  'Training Domain',
  'Team Size',
  'Status',
  'Date Submitted',
];

/** Wrap every value in `"…"` and escape internal `"` as `""` per the spec. */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Format an ISO timestamp as `26 Apr 2026 14:30` in the user's local TZ. */
function formatExportDate(iso: string): string {
  const d = new Date(iso);
  // `en-GB` with these options yields `26 Apr 2026, 14:30` — strip the comma.
  return d
    .toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(',', '');
}

/** YYYY-MM-DD in local time for the filename. */
function todayIsoDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function exportCorporateLeadsCsv(leads: AdminCorporateLeadItem[]): void {
  if (leads.length === 0) return;

  const rows: string[][] = leads.map((lead, i) => [
    String(i + 1),
    lead.companyName,
    lead.contactPerson,
    lead.phone,
    lead.email,
    lead.trainingDomain,
    lead.employeeCount,
    lead.status,
    formatExportDate(lead.createdAt),
  ]);

  // \r\n line endings — Excel-friendliest. UTF-8 BOM optional; we skip it
  // because all our fields are ASCII-safe in practice.
  const csv = [CSV_HEADERS, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `coss-corporate-leads-${todayIsoDate()}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

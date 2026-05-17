'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Inbox,
  Loader2,
  Phone,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type {
  AdminLeadListItem,
  AdminLeadsListResponse,
} from '@/app/api/admin/leads/route';
import LeadDrawer from '@/components/admin/LeadDrawer';

/* -------------------------------------------------------------------------- */
/*  Constants / typed enums                                                   */
/* -------------------------------------------------------------------------- */

const STATUS_OPTIONS = ['new', 'contacted', 'enrolled', 'lost'] as const;
type Status = (typeof STATUS_OPTIONS)[number];

const BRANCH_OPTIONS = ['dilsukhnagar', 'ameerpet', 'online'] as const;
type Branch = (typeof BRANCH_OPTIONS)[number];

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

const BRANCH_LABEL: Record<Branch, string> = {
  dilsukhnagar: 'Dilsukhnagar',
  ameerpet: 'Ameerpet',
  online: 'Online',
};

const BRANCH_STYLES: Record<Branch, string> = {
  dilsukhnagar: 'bg-teal-50 text-teal-700 ring-teal-200',
  ameerpet: 'bg-purple-50 text-purple-700 ring-purple-200',
  online: 'bg-blue-50 text-blue-700 ring-blue-200',
};

const PAGE_SIZE = 25;
const EXPORT_PAGE_SIZE = 100;
const EXPORT_MAX_ROWS = 10_000;
const SEARCH_DEBOUNCE_MS = 400;

function isStatus(value: string): value is Status {
  return (STATUS_OPTIONS as ReadonlyArray<string>).includes(value);
}

function isBranch(value: string): value is Branch {
  return (BRANCH_OPTIONS as ReadonlyArray<string>).includes(value);
}

/* -------------------------------------------------------------------------- */
/*  Root                                                                      */
/* -------------------------------------------------------------------------- */

export function LeadsTable(): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL-derived state (single source of truth for filters + page).
  const statusParam = searchParams.get('status') ?? '';
  const branchParam = searchParams.get('branch') ?? '';
  const searchParam = searchParams.get('search') ?? '';
  const pageParamRaw = Number(searchParams.get('page') ?? '1');
  const pageParam =
    Number.isFinite(pageParamRaw) && pageParamRaw >= 1
      ? Math.floor(pageParamRaw)
      : 1;

  // Data state
  const [leads, setLeads] = useState<AdminLeadListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lead-detail drawer: which lead is expanded. `null` = drawer closed.
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Local controlled state for the search input so typing feels instant while
  // the debounced URL update catches up 400 ms later.
  const [searchInput, setSearchInput] = useState(searchParam);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the input in sync if URL changes from elsewhere (clear filters, etc.)
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  /* -------------------------- URL helpers -------------------------------- */

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const onSearchChange = (value: string): void => {
    setSearchInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      // Reset to page 1 on every new search.
      updateParams({ search: value || null, page: null });
    }, SEARCH_DEBOUNCE_MS);
  };

  const clearFilters = (): void => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearchInput('');
    router.replace(pathname);
  };

  /* -------------------------- Data fetching ------------------------------ */

  useEffect(() => {
    const controller = new AbortController();

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);

      const qs = new URLSearchParams();
      if (statusParam) qs.set('status', statusParam);
      if (branchParam) qs.set('branch', branchParam);
      if (searchParam) qs.set('search', searchParam);
      qs.set('page', String(pageParam));
      qs.set('limit', String(PAGE_SIZE));

      try {
        const res = await fetch(`/api/admin/leads?${qs.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }
        const data = (await res.json()) as AdminLeadsListResponse;
        setLeads(data.leads);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load leads');
        setLeads([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [statusParam, branchParam, searchParam, pageParam]);

  /* -------------------------- Mutations ---------------------------------- */

  const updateStatus = useCallback(
    async (id: string, nextStatus: Status): Promise<void> => {
      // Optimistic: flip locally, rollback on failure.
      setLeads((curr) =>
        curr.map((l) => (l.id === id ? { ...l, status: nextStatus } : l)),
      );
      try {
        const res = await fetch(`/api/admin/leads/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (!res.ok) throw new Error(`PATCH failed (${res.status})`);
      } catch {
        // Rollback by re-fetching current page. Simple + safe.
        updateParams({});
      }
    },
    [updateParams],
  );

  const deleteLead = useCallback(
    async (id: string): Promise<void> => {
      if (!window.confirm('Delete this lead? This cannot be undone.')) return;

      const snapshot = leads;
      setLeads((curr) => curr.filter((l) => l.id !== id));
      setTotal((t) => Math.max(0, t - 1));

      try {
        const res = await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' });
        if (!res.ok && res.status !== 204) {
          throw new Error(`DELETE failed (${res.status})`);
        }
      } catch {
        setLeads(snapshot);
        setTotal((t) => t + 1);
      }
    },
    [leads],
  );

  /* -------------------------- CSV export --------------------------------- */

  const [exporting, setExporting] = useState(false);
  const exportCsv = useCallback(async (): Promise<void> => {
    setExporting(true);
    try {
      const base = new URLSearchParams();
      if (statusParam) base.set('status', statusParam);
      if (branchParam) base.set('branch', branchParam);
      if (searchParam) base.set('search', searchParam);
      base.set('limit', String(EXPORT_PAGE_SIZE));

      const all: AdminLeadListItem[] = [];
      let currentPage = 1;
      let knownTotalPages = 1;

      do {
        base.set('page', String(currentPage));
        const res = await fetch(`/api/admin/leads?${base.toString()}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Export request failed (${res.status})`);
        const data = (await res.json()) as AdminLeadsListResponse;
        all.push(...data.leads);
        knownTotalPages = data.totalPages;
        currentPage += 1;
      } while (currentPage <= knownTotalPages && all.length < EXPORT_MAX_ROWS);

      const header = [
        'Name',
        'Phone',
        'Email',
        'Course',
        'Branch',
        'Status',
        'Source Form',
        'Created (ISO)',
      ];
      const rows = all.map((l) => [
        l.name,
        l.phone,
        l.email ?? '',
        l.course ?? '',
        l.branch,
        l.status,
        l.formType,
        new Date(l.createdAt).toISOString(),
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map(csvEscape).join(','))
        .join('\r\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coss-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [statusParam, branchParam, searchParam]);

  /* -------------------------- Derived UI state --------------------------- */

  const hasActiveFilters =
    statusParam !== '' || branchParam !== '' || searchParam !== '';
  const pageStart = total === 0 ? 0 : (pageParam - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(pageParam * PAGE_SIZE, total);

  /* -------------------------- Render ------------------------------------- */

  return (
    <div className="space-y-4">
      {/* Filter bar -------------------------------------------------------- */}
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
              placeholder="Search name, phone, course…"
              aria-label="Search leads"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={branchParam}
              onChange={(e) =>
                updateParams({
                  branch: e.target.value || null,
                  page: null,
                })
              }
              aria-label="Filter by branch"
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-3 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            >
              <option value="">All Branches</option>
              {BRANCH_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {BRANCH_LABEL[b]}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void exportCsv()}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              Export CSV
            </button>
          </div>
        </div>

        {/* Status pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <StatusPill
            active={statusParam === ''}
            label="All"
            onClick={() => updateParams({ status: null, page: null })}
          />
          {STATUS_OPTIONS.map((s) => (
            <StatusPill
              key={s}
              active={statusParam === s}
              label={STATUS_LABEL[s]}
              onClick={() => updateParams({ status: s, page: null })}
            />
          ))}
        </div>
      </div>

      {/* Mobile card list ─── visible only on < md ─────────────────────── */}
      <div className="md:hidden space-y-2">
        {loading && leads.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-14 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-white dark:bg-gray-800 px-4 py-8 text-center text-sm text-red-600">
            {error}
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-14">
            <EmptyState onClear={clearFilters} hasActiveFilters={hasActiveFilters} />
          </div>
        ) : (
          leads.map((lead, i) => (
            <MobileLeadCard
              key={lead.id}
              lead={lead}
              onStatusChange={updateStatus}
              onDelete={deleteLead}
              onView={setSelectedLeadId}
            />
          ))
        )}
        {loading && leads.length > 0 && (
          <div className="py-2 text-center">
            <Loader2 className="mx-auto h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Desktop table ─── hidden on < md ──────────────────────────────── */}
      <div className="hidden md:block relative overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <th scope="col" className="w-10 px-4 py-2.5">
                #
              </th>
              <th scope="col" className="px-4 py-2.5">
                Name
              </th>
              <th scope="col" className="px-4 py-2.5">
                Course
              </th>
              <th scope="col" className="px-4 py-2.5">
                Branch
              </th>
              <th scope="col" className="px-4 py-2.5">
                Inquiry Type
              </th>
              <th scope="col" className="px-4 py-2.5">
                Status
              </th>
              <th scope="col" className="px-4 py-2.5">
                Source Form
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
            {loading && leads.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-14 text-center text-sm text-gray-500"
                >
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-400" />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-14 text-center text-sm text-red-600"
                >
                  {error}
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-14">
                  <EmptyState
                    onClear={clearFilters}
                    hasActiveFilters={hasActiveFilters}
                  />
                </td>
              </tr>
            ) : (
              leads.map((lead, i) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  index={pageStart + i}
                  onStatusChange={updateStatus}
                  onDelete={deleteLead}
                  onView={setSelectedLeadId}
                />
              ))
            )}
          </tbody>
        </table>
        {/* Subtle top-right spinner during refetches while rows are visible. */}
        {loading && leads.length > 0 && (
          <div className="pointer-events-none absolute right-3 top-3">
            <Loader2
              className="h-4 w-4 animate-spin text-gray-400"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Detail drawer — fixed overlay, rendered only when a row is opened. */}
      <LeadDrawer
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onStatusChanged={(id, nextStatus) => {
          // Keep the visible row in sync with the drawer's edit without a
          // full refetch of the page.
          setLeads((curr) =>
            curr.map((l) => (l.id === id ? { ...l, status: nextStatus } : l)),
          );
        }}
      />

      {/* Pagination -------------------------------------------------------- */}
      {total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm md:flex-row">
          <p className="text-gray-600 dark:text-gray-400">
            Showing{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {pageStart.toLocaleString()}
            </span>
            –
            <span className="font-medium text-gray-900 dark:text-white">
              {pageEnd.toLocaleString()}
            </span>{' '}
            of{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {total.toLocaleString()}
            </span>{' '}
            leads
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => updateParams({ page: String(pageParam - 1) })}
              disabled={pageParam <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1.5 text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Prev
            </button>
            <span className="px-2 text-xs text-gray-500 dark:text-gray-400">
              Page {pageParam} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => updateParams({ page: String(pageParam + 1) })}
              disabled={pageParam >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1.5 text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

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

function LeadRow({
  lead,
  index,
  onStatusChange,
  onDelete,
  onView,
}: {
  lead: AdminLeadListItem;
  index: number;
  onStatusChange: (id: string, next: Status) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onView: (id: string) => void;
}): JSX.Element {
  const branchKey = lead.branch.toLowerCase();
  const branchLabel = isBranch(branchKey)
    ? BRANCH_LABEL[branchKey]
    : lead.branch;
  const branchClass = isBranch(branchKey)
    ? BRANCH_STYLES[branchKey]
    : 'bg-gray-50 text-gray-700 ring-gray-200';

  // `Inquiry Type` is a human-friendly derivation until we add a dedicated
  // column — course-linked submissions are course inquiries, everything else
  // is a general inquiry.
  const inquiryType = lead.course ? 'Course Inquiry' : 'General';

  return (
    <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-700/40">
      <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">{index}</td>

      <td className="px-4 py-3">
        <p className="font-semibold text-gray-900 dark:text-white">{lead.name}</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{lead.phone}</p>
      </td>

      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
        {lead.course ?? <span className="text-gray-400 dark:text-gray-500">—</span>}
      </td>

      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${branchClass}`}
        >
          {branchLabel}
        </span>
      </td>

      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{inquiryType}</td>

      <td className="px-4 py-3">
        <StatusBadgeMenu lead={lead} onStatusChange={onStatusChange} />
      </td>

      <td className="px-4 py-3">
        <span className="rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {lead.formType}
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
            label="Mark as contacted"
            icon={<Phone className="h-4 w-4" />}
            onClick={() => {
              void onStatusChange(lead.id, 'contacted');
            }}
          />
          <IconButton
            label="Delete lead"
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

/**
 * Status badge + floating popover. The popover is rendered through a portal
 * to `document.body` so it's never clipped by the table's overflow-x container.
 */
function StatusBadgeMenu({
  lead,
  onStatusChange,
}: {
  lead: AdminLeadListItem;
  onStatusChange: (id: string, next: Status) => Promise<void>;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on outside click, Escape, scroll, or resize.
  useEffect(() => {
    if (!open) return;

    function onDocClick(e: MouseEvent): void {
      const target = e.target as Node | null;
      if (!target) return;
      if (btnRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setOpen(false);
    }
    function onReflow(): void {
      setOpen(false);
    }

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
    };
  }, [open]);

  const statusKey: Status = isStatus(lead.status.toLowerCase())
    ? (lead.status.toLowerCase() as Status)
    : 'new';
  const styles = STATUS_STYLES[statusKey];

  function toggle(): void {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    // Prevent the 160px (w-40) menu from overflowing the right edge of the
    // viewport on small screens — right-align it against the button instead.
    const menuWidth = 160;
    const left =
      rect.left + menuWidth > window.innerWidth
        ? Math.max(4, rect.right - menuWidth)
        : rect.left;
    setCoords({
      top: rect.bottom + 4,
      left,
    });
    setOpen((prev) => !prev);
  }

  function pick(s: Status): void {
    setOpen(false);
    void onStatusChange(lead.id, s);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset transition hover:brightness-95 ${styles.pill}`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${styles.dot}`}
          aria-hidden="true"
        />
        {STATUS_LABEL[statusKey]}
      </button>

      {mounted && open && coords
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ position: 'fixed', top: coords.top, left: coords.left }}
              className="z-50 w-40 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 shadow-lg"
            >
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  role="menuitem"
                  type="button"
                  onClick={() => pick(s)}
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
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  variant = 'default',
}: {
  label: string;
  icon: ReactNode;
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

function EmptyState({
  onClear,
  hasActiveFilters,
}: {
  onClear: () => void;
  hasActiveFilters: boolean;
}): JSX.Element {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="rounded-full bg-gray-100 p-4 text-gray-400">
        <Inbox className="h-8 w-8" aria-hidden="true" />
      </div>
      <p className="mt-4 text-sm font-medium text-gray-900">No leads found</p>
      <p className="mt-1 text-xs text-gray-500">
        {hasActiveFilters
          ? 'Try a different search term or clear your filters.'
          : 'Nothing here yet — new submissions from the public site will appear instantly.'}
      </p>
      {hasActiveFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mobile lead card                                                          */
/* -------------------------------------------------------------------------- */

function MobileLeadCard({
  lead,
  onStatusChange,
  onDelete,
  onView,
}: {
  lead: AdminLeadListItem;
  onStatusChange: (id: string, next: Status) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onView: (id: string) => void;
}): JSX.Element {
  const branchKey = lead.branch.toLowerCase();
  const branchLabel = isBranch(branchKey) ? BRANCH_LABEL[branchKey] : lead.branch;
  const branchClass = isBranch(branchKey)
    ? BRANCH_STYLES[branchKey]
    : 'bg-gray-50 text-gray-700 ring-gray-200';

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      {/* Row 1: name + status badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{lead.name}</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{lead.phone}</p>
        </div>
        <StatusBadgeMenu lead={lead} onStatusChange={onStatusChange} />
      </div>

      {/* Row 2: course + branch + time */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
        {lead.course ? (
          <span className="truncate max-w-[160px] text-gray-700">{lead.course}</span>
        ) : (
          <span className="text-gray-400">No course</span>
        )}
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${branchClass}`}
        >
          {branchLabel}
        </span>
        <span className="ml-auto text-[11px] text-gray-400">
          {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Row 3: form source tag + action buttons */}
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-2.5">
        <span className="rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {lead.formType}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onView(lead.id)}
            aria-label="View details"
            className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs font-medium text-teal-700 transition hover:bg-teal-100"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            View
          </button>
          <button
            type="button"
            onClick={() => {
              void onStatusChange(lead.id, 'contacted');
            }}
            aria-label="Mark as contacted"
            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            Call
          </button>
          <button
            type="button"
            onClick={() => {
              void onDelete(lead.id);
            }}
            aria-label="Delete lead"
            className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  CSV helpers                                                               */
/* -------------------------------------------------------------------------- */

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle } from 'lucide-react';
import type {
  WhatsAppAdminResponse,
  WidgetLead,
} from '@/app/api/admin/whatsapp/route';
import { conversionDisplay } from '@/lib/conversion-display';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

type Status = 'new' | 'contacted' | 'enrolled' | 'lost';

const STATUS_LABEL: Record<Status, string> = {
  new: 'New',
  contacted: 'Contacted',
  enrolled: 'Enrolled',
  lost: 'Lost',
};

const STATUS_STYLES: Record<Status, { pill: string; dot: string }> = {
  new: { pill: 'bg-[#dcfce7] text-[#15803d] ring-[#bbf7d0] dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-700', dot: 'bg-emerald-500' },
  contacted: {
    pill: 'bg-[#dbeafe] text-[#1d4ed8] ring-[#bfdbfe] dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-700',
    dot: 'bg-blue-500',
  },
  enrolled: {
    pill: 'bg-[#f3e8ff] text-[#7c3aed] ring-[#e9d5ff] dark:bg-purple-900/30 dark:text-purple-400 dark:ring-purple-700',
    dot: 'bg-purple-500',
  },
  lost: { pill: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-700', dot: 'bg-red-500' },
};

const BRANCH_LABEL: Record<string, string> = {
  dilsukhnagar: 'Dilsukhnagar',
  ameerpet: 'Ameerpet',
  online: 'Online',
};

// Mobile card backgrounds — cycle via index % 3
const MOBILE_CARD_BG: readonly string[] = ['bg-[#024c57]', 'bg-[#1d4ed8]', 'bg-[#7c3aed]'];

// Stat card light-mode backgrounds and dark-mode accent bars by index
const STAT_LIGHT_BG: readonly string[] = ['bg-[#024c57]', 'bg-[#1d4ed8]', 'bg-[#03798a]', 'bg-[#7c3aed]'];
const STAT_DARK_ACCENT: readonly string[] = ['bg-emerald-500', 'bg-blue-500', 'bg-teal-500', 'bg-orange-500'];

function isStatus(v: string): v is Status {
  return v === 'new' || v === 'contacted' || v === 'enrolled' || v === 'lost';
}

function fmt(n: number): string {
  return n.toLocaleString();
}

function mobileBadgeClass(statusKey: Status): string {
  if (statusKey === 'new') {
    return 'bg-[#5ef0c8] text-[#012e36] font-bold dark:bg-[#1f3a2d] dark:text-[#3fb950]';
  }
  return 'bg-white/30 text-white dark:bg-[#21262d] dark:text-[#c9d1d9]';
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function WhatsAppAdminPage(): JSX.Element {
  const [data, setData] = useState<WhatsAppAdminResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/whatsapp', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = (await res.json()) as WhatsAppAdminResponse;
        if (!cancelled) setData(json);
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return;
        console.error('[WhatsAppAdminPage] load failed:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load');
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

  return (
    <div className="space-y-4 bg-[#e6f4f6] dark:bg-[#0d1117]">
      {/* Topbar --------------------------------------------------------- */}
      <header className="flex items-center justify-between rounded-xl bg-[#024c57] dark:bg-[#0d1117] px-5 py-4">
        <div>
          <h1 className="text-xl font-semibold text-white">WhatsApp Log</h1>
          <p className="mt-1 text-sm text-white/60">
            Floating widget submissions and per-lead WhatsApp send history.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-white/15 px-2.5 py-1 text-xs font-medium text-[#5ef0c8]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5ef0c8]" aria-hidden="true" />
          Live
        </span>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Widget stats row -------------------------------------------- */}
      {data === null && loading ? (
        <StatsSkeleton />
      ) : data === null ? null : (
        <>
          <WidgetStatsRow
            total={data.widgetStats.total}
            enrolled={data.widgetStats.enrolled}
            thisMonth={data.widgetStats.thisMonth}
            topCourse={data.widgetStats.topCourse}
            conversionRate={data.widgetStats.conversionRate}
          />

          {/* Widget leads table ------------------------------------ */}
          <WidgetLeadsTable leads={data.widgetStats.recentLeads} />

          {/* Activity log ------------------------------------------ */}
          <ActivityLog activities={data.recentActivities} />
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Widget stats row                                                          */
/* -------------------------------------------------------------------------- */

function WidgetStatsRow({
  total,
  enrolled,
  thisMonth,
  topCourse,
  conversionRate,
}: {
  total: number;
  enrolled: number;
  thisMonth: number;
  topCourse: string;
  conversionRate: number;
}): JSX.Element {
  const items: Array<{ label: string; value: string }> = [
    { label: 'Widget Leads', value: fmt(total) },
    { label: 'This Month', value: fmt(thisMonth) },
    { label: 'Top Course', value: topCourse },
    { label: 'Conversion Rate', value: conversionDisplay(enrolled, total, conversionRate) },
  ];

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <MessageCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" />
        Widget Performance
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <div
            key={item.label}
            className={`relative overflow-hidden rounded-xl p-3 ${STAT_LIGHT_BG[i]} dark:border dark:border-gray-700 dark:bg-gray-800`}
          >
            {/* Dark-mode accent bar */}
            <div
              className={`absolute left-0 top-0 h-1 w-full ${STAT_DARK_ACCENT[i]} hidden dark:block`}
              aria-hidden="true"
            />
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/65 dark:text-gray-400">
              {item.label}
            </p>
            <p className="text-2xl font-medium text-white truncate" title={item.value}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Widget leads table                                                        */
/* -------------------------------------------------------------------------- */

function WidgetLeadsTable({ leads }: { leads: WidgetLead[] }): JSX.Element {
  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Section header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-5 py-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Widget Leads</h2>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Last 20 submissions captured by the floating WhatsApp widget.
        </p>
      </div>

      {/* ── Mobile cards (< lg) ──────────────────────────────────────── */}
      <div className="block lg:hidden p-3">
        {leads.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No widget leads yet — submissions from the floating chat button will appear here.
          </p>
        ) : (
          leads.map((lead, i) => {
            const statusKey: Status = isStatus(lead.status.toLowerCase())
              ? (lead.status.toLowerCase() as Status)
              : 'new';
            const cardBg = MOBILE_CARD_BG[i % 3];
            const branch = BRANCH_LABEL[lead.branch.toLowerCase()] ?? lead.branch;

            return (
              <div
                key={lead.id}
                className={`${cardBg} dark:bg-[#161b22] dark:border dark:border-[#21262d] rounded-xl p-3 mb-2`}
              >
                {/* Row 1: Name + status badge */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white dark:text-[#e6edf3] font-medium text-sm truncate pr-2">
                    {lead.name}
                  </span>
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 shrink-0 ${mobileBadgeClass(statusKey)}`}
                  >
                    {STATUS_LABEL[statusKey]}
                  </span>
                </div>

                {/* Row 2: Phone */}
                <p className="text-white/70 dark:text-[#8b949e] text-xs mb-1.5">
                  {lead.phone}
                </p>

                {/* Row 3: Course + Branch badges */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {lead.course ? (
                    <span className="bg-white/20 text-white text-xs rounded-full px-2 py-0.5">
                      {lead.course}
                    </span>
                  ) : null}
                  <span className="bg-white/20 text-white text-xs rounded-full px-2 py-0.5">
                    {branch}
                  </span>
                </div>

                {/* Row 4: Action buttons */}
                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#059669] dark:bg-[#1a2c1e] dark:border dark:border-[#2ea043] text-white dark:text-[#3fb950] rounded-lg flex-1 py-1.5 text-xs font-medium flex items-center justify-center"
                  >
                    <i className="ti ti-brand-whatsapp mr-1" aria-hidden="true" />
                    WhatsApp
                  </a>
                  <a
                    href={`/admin/leads/${lead.id}`}
                    className="bg-white/20 dark:bg-[#21262d] dark:border dark:border-[#30363d] text-white dark:text-[#c9d1d9] rounded-lg flex-1 py-1.5 text-xs text-center flex items-center justify-center"
                  >
                    View lead
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Desktop table (lg+) ──────────────────────────────────────── */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <th scope="col" className="px-5 py-2.5">Name</th>
              <th scope="col" className="px-5 py-2.5">Phone</th>
              <th scope="col" className="px-5 py-2.5">Course</th>
              <th scope="col" className="px-5 py-2.5">Branch</th>
              <th scope="col" className="px-5 py-2.5">Status</th>
              <th scope="col" className="px-5 py-2.5">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {leads.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No widget leads yet — submissions from the floating chat
                  button will appear here.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const statusKey: Status = isStatus(lead.status.toLowerCase())
                  ? (lead.status.toLowerCase() as Status)
                  : 'new';
                const style = STATUS_STYLES[statusKey];
                return (
                  <tr key={lead.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/40">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">
                      {lead.name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-gray-700 dark:text-gray-300">
                      {lead.phone}
                    </td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                      {lead.course ?? <span className="text-gray-400 dark:text-gray-500">—</span>}
                    </td>
                    <td className="px-5 py-3 capitalize text-gray-700 dark:text-gray-300">
                      {BRANCH_LABEL[lead.branch.toLowerCase()] ?? lead.branch}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style.pill}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                          aria-hidden="true"
                        />
                        {STATUS_LABEL[statusKey]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(lead.createdAt), {
                        addSuffix: true,
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Recent activity log                                                       */
/* -------------------------------------------------------------------------- */

function ActivityLog({
  activities,
}: {
  activities: ReadonlyArray<{
    id: string;
    leadId: string;
    leadName: string;
    note: string;
    createdAt: string;
  }>;
}): JSX.Element {
  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
        Recent WhatsApp Sends
      </h2>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        Latest 30 `whatsapp_sent` activities across all leads.
      </p>
      {activities.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-4 text-center text-xs text-gray-500 dark:text-gray-400">
          No WhatsApp send activity yet.
        </p>
      ) : (
        <ol className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
          {activities.map((a) => (
            <li
              key={a.id}
              className="flex items-start gap-3 py-3 text-sm"
            >
              <span
                className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-gray-900 dark:text-gray-100">
                  <span className="font-semibold">{a.leadName}</span>{' '}
                  <span className="text-gray-500 dark:text-gray-400">{a.note}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                  {formatDistanceToNow(new Date(a.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                  */
/* -------------------------------------------------------------------------- */

function StatsSkeleton(): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800" />
      <div className="h-48 animate-pulse rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800" />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle } from 'lucide-react';
import type {
  WhatsAppAdminResponse,
  WidgetLead,
} from '@/app/api/admin/whatsapp/route';

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

function isStatus(v: string): v is Status {
  return v === 'new' || v === 'contacted' || v === 'enrolled' || v === 'lost';
}

function fmt(n: number): string {
  return n.toLocaleString();
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
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">WhatsApp Log</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Floating widget submissions and per-lead WhatsApp send history.
        </p>
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
  thisMonth,
  topCourse,
  conversionRate,
}: {
  total: number;
  thisMonth: number;
  topCourse: string;
  conversionRate: number;
}): JSX.Element {
  const items: Array<{ label: string; value: string; accent: string }> = [
    { label: 'Widget Leads', value: fmt(total), accent: 'bg-emerald-500' },
    { label: 'This Month', value: fmt(thisMonth), accent: 'bg-blue-500' },
    { label: 'Top Course', value: topCourse, accent: 'bg-teal-500' },
    {
      label: 'Conversion Rate',
      value: `${conversionRate.toFixed(1)}%`,
      accent: 'bg-orange-500',
    },
  ];

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <MessageCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" />
        Widget Performance
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
          >
            <div
              className={`absolute left-0 top-0 h-1 w-full ${item.accent}`}
              aria-hidden="true"
            />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white truncate" title={item.value}>
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
    <section className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="border-b border-gray-200 dark:border-gray-700 px-5 py-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Widget Leads</h2>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Last 20 submissions captured by the floating WhatsApp widget.
        </p>
      </div>
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

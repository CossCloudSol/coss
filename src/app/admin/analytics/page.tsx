'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Download, Loader2, RefreshCw } from 'lucide-react';
import type { AnalyticsResponse } from '@/app/api/admin/analytics/route';
import { conversionDisplay } from '@/lib/conversion-display';

/* -------------------------------------------------------------------------- */
/*  Helpers / palettes                                                        */
/* -------------------------------------------------------------------------- */

const FUNNEL_COLORS: Record<string, string> = {
  new: 'bg-teal-300',
  contacted: 'bg-teal-500',
  enrolled: 'bg-teal-700',
  lost: 'bg-rose-400',
};

const MOBILE_FUNNEL_CONFIG: Record<string, { lightBg: string; darkBg: string; countColor: string; width: string }> = {
  new:       { lightBg: 'bg-[#024c57]', darkBg: 'dark:bg-[#1b8a6b]', countColor: '#5ef0c8', width: 'w-full' },
  contacted: { lightBg: 'bg-[#1d4ed8]', darkBg: 'dark:bg-[#1f6feb]', countColor: '#93c5fd', width: 'w-3/4'  },
  enrolled:  { lightBg: 'bg-[#7c3aed]', darkBg: 'dark:bg-[#8957e5]', countColor: '#d8b4fe', width: 'w-2/5'  },
};

const BRANCH_MOBILE_BG: Record<string, string> = {
  dilsukhnagar: 'bg-[#024c57]',
  ameerpet:     'bg-[#03798a]',
  online:       'bg-[#1d4ed8]',
};
const BRANCH_BG_CYCLE = ['bg-[#024c57]', 'bg-[#03798a]', 'bg-[#1d4ed8]'];

const STATUS_PALETTE: Record<string, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-amber-500',
  enrolled: 'bg-emerald-500',
  lost: 'bg-red-500',
};

function fmt(n: number): string {
  return n.toLocaleString();
}

function conversionColor(rate: number): string {
  if (rate > 30) return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30';
  if (rate > 15) return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30';
  return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30';
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function AnalyticsPage(): JSX.Element {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [tick, setTick] = useState(0); // forces "X min ago" to refresh

  const load = useCallback(async (controller?: AbortController): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/analytics', {
        signal: controller?.signal,
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = (await res.json()) as AnalyticsResponse;
      setData(json);
      setLastFetched(new Date());
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
      console.error('[AnalyticsPage] load failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller);
    return () => controller.abort();
  }, [load]);

  // "X min ago" tick — re-render the timestamp every 30s
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30 * 1000);
    return () => clearInterval(interval);
  }, []);
  void tick;

  return (
    <div className="space-y-4">
      {/* Header --------------------------------------------------------- */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Funnel, branch performance, WhatsApp impact, and 30-day volume.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastFetched ? (
            <p className="text-xs text-gray-500">
              Last updated{' '}
              {formatDistanceToNow(lastFetched, { addSuffix: true })}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Refresh
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Loading skeleton (initial) ------------------------------------- */}
      {data === null && loading ? (
        <SkeletonGrid />
      ) : data === null ? null : (
        <>
          <StatsRow data={data} />
          <Funnel data={data.funnel} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <BarList
              title="Leads by Course"
              subtitle="Top 8 by submission count"
              items={data.byCourse.map((c) => ({
                label: c.course,
                value: c.count,
              }))}
            />
            <BarList
              title="Leads by Inquiry Type"
              subtitle="Course-specific vs general inquiries"
              items={data.byInquiryType.map((c) => ({
                label: c.type,
                value: c.count,
              }))}
            />
          </div>
          <BranchTable data={data.byBranch} />
          <FormSourceTable data={data.byFormSource} />
          <WhatsAppCard data={data.whatsapp} />
          <DailyChart data={data.dailyLeads} />
          <DigestPlaceholder />
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stats row                                                                 */
/* -------------------------------------------------------------------------- */

function StatsRow({ data }: { data: AnalyticsResponse }): JSX.Element {
  const mobileCards = [
    { label: 'Total Leads',   value: fmt(data.totals.leads),       bg: 'bg-[#024c57]' },
    { label: 'Enrolled',      value: fmt(data.totals.enrolled),     bg: 'bg-[#1d4ed8]' },
    { label: 'This Month',    value: fmt(data.totals.thisMonth),    bg: 'bg-[#d97706]' },
    { label: 'WhatsApp Sent', value: fmt(data.totals.whatsappSent), bg: 'bg-[#7c3aed]' },
  ];

  const desktopCards: Array<{ label: string; value: string; accent: string }> = [
    { label: 'Total Leads',     value: fmt(data.totals.leads),          accent: 'bg-blue-500'    },
    { label: 'Enrolled',        value: fmt(data.totals.enrolled),        accent: 'bg-emerald-500' },
    { label: 'Conversion Rate', value: `${data.totals.conversionRate.toFixed(1)}%`, accent: 'bg-teal-500' },
    {
      label: 'Avg Response',
      value: data.totals.avgResponseHours === null ? '—' : `${data.totals.avgResponseHours.toFixed(1)} hrs`,
      accent: 'bg-orange-500',
    },
    { label: 'This Month',    value: fmt(data.totals.thisMonth),    accent: 'bg-purple-500' },
    { label: 'WhatsApp Sent', value: fmt(data.totals.whatsappSent), accent: 'bg-green-500'  },
  ];

  return (
    <>
      {/* Mobile 2×2 — 4 key metrics with solid coloured fills */}
      <div className="grid grid-cols-2 gap-3 mb-4 lg:hidden">
        {mobileCards.map((item) => (
          <div key={item.label} className={`rounded-xl p-4 ${item.bg}`}>
            <p className="text-[10px] font-medium uppercase tracking-wide text-white/65">{item.label}</p>
            <p className="mt-2 text-2xl font-medium text-white">{item.value}</p>
          </div>
        ))}
      </div>
      {/* Desktop 6-col — existing layout unchanged */}
      <div className="hidden lg:grid lg:grid-cols-6 gap-3">
        {desktopCards.map((item) => (
          <div
            key={item.label}
            className="relative overflow-hidden rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
          >
            <div className={`absolute left-0 top-0 h-1 w-full ${item.accent}`} aria-hidden="true" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {item.label}
            </p>
            <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">{item.value}</p>
          </div>
        ))}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Conversion funnel                                                         */
/* -------------------------------------------------------------------------- */

function Funnel({
  data,
}: {
  data: AnalyticsResponse['funnel'];
}): JSX.Element {
  const max = Math.max(...data.map((s) => s.count), 1);
  const total = data.reduce((sum, s) => sum + s.count, 0);
  const mobileFunnelStages = data.filter((s) => s.key in MOBILE_FUNNEL_CONFIG);

  return (
    <section className="rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Conversion Funnel</h2>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        Lead progression — counts and drop-off between stages.
      </p>

      {/* Mobile — full-width coloured bars, label + count both inside */}
      <div className="mt-4 block lg:hidden">
        {mobileFunnelStages.map((stage, i) => {
          const cfg = MOBILE_FUNNEL_CONFIG[stage.key]!;
          const prevStage = i > 0 ? mobileFunnelStages[i - 1] : undefined;
          const prevCount = prevStage ? prevStage.count : null;
          const dropoff =
            prevCount !== null && prevCount > 0
              ? Math.round(((prevCount - stage.count) / prevCount) * 1000) / 10
              : null;
          return (
            <div key={stage.key}>
              {dropoff !== null ? (
                <p className="ml-1 mb-1 text-xs font-medium text-[#03798a] dark:font-normal dark:text-[#8b949e]">
                  ↓ {dropoff.toFixed(1)}% drop off
                </p>
              ) : null}
              <div className={`flex items-center px-3 rounded-lg mb-1.5 h-8 ${cfg.width} ${cfg.lightBg} ${cfg.darkBg}`}>
                <span className="flex-1 text-sm font-semibold text-white">{stage.stage}</span>
                <span className="text-sm font-bold" style={{ color: cfg.countColor }}>{fmt(stage.count)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop — existing proportional bars unchanged */}
      <div className="mt-4 hidden lg:block space-y-2">
        {data.map((stage, i) => {
          const widthPercent = (stage.count / max) * 100;
          const totalShare = total === 0 ? 0 : (stage.count / total) * 100;
          const previousCount = i > 0 ? data[i - 1].count : null;
          const dropoff =
            previousCount !== null && previousCount > 0
              ? Math.round(
                  ((previousCount - stage.count) / previousCount) * 1000,
                ) / 10
              : null;
          return (
            <div key={stage.key}>
              {dropoff !== null ? (
                <p className="ml-2 mb-1 text-[11px] text-gray-500 dark:text-gray-400">
                  ↓ {dropoff.toFixed(1)}% drop-off
                </p>
              ) : null}
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
                  <div
                    className={`flex h-full items-center px-3 text-xs font-semibold text-white transition-all ${
                      FUNNEL_COLORS[stage.key] ?? 'bg-teal-500'
                    }`}
                    style={{ width: `${Math.max(8, widthPercent)}%` }}
                  >
                    {stage.stage}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {fmt(stage.count)}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {totalShare.toFixed(1)}% of total
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Generic horizontal bar list                                               */
/* -------------------------------------------------------------------------- */

function BarList({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: Array<{ label: string; value: number }>;
}): JSX.Element {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <section className="rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      {items.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-[#e2e8f0] dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-4 text-center text-xs text-gray-500 dark:text-gray-400">
          No data yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.map((item) => {
            const widthPercent = (item.value / max) * 100;
            return (
              <li key={item.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="truncate text-gray-700 dark:text-gray-300">{item.label}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {fmt(item.value)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all"
                    style={{ width: `${widthPercent}%` }}
                    aria-hidden="true"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Branch performance table                                                  */
/* -------------------------------------------------------------------------- */

const BRANCH_LABEL: Record<string, string> = {
  dilsukhnagar: 'Dilsukhnagar',
  ameerpet: 'Ameerpet',
  online: 'Online',
};

function BranchTable({
  data,
}: {
  data: AnalyticsResponse['byBranch'];
}): JSX.Element {
  return (
    <section className="rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-start justify-between gap-3 border-b border-[#e2e8f0] dark:border-gray-700 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Branch Performance</h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Lead pipeline + conversion rate by branch.
          </p>
        </div>
        <ExportCsvButton onClick={() => exportBranchCsv(data)} />
      </div>

      {/* Mobile — one stat card per branch */}
      <div className="block lg:hidden p-4 space-y-2">
        {data.map((row, index) => {
          const branchBg =
            BRANCH_MOBILE_BG[row.branch] ??
            (BRANCH_BG_CYCLE[index % BRANCH_BG_CYCLE.length] ?? 'bg-[#024c57]');
          return (
            <div
              key={row.branch}
              className={`rounded-xl p-3 flex items-center justify-between ${branchBg} dark:bg-[#161b22] dark:border dark:border-[#21262d]`}
            >
              <span className="text-white dark:text-[#e6edf3] font-medium text-sm">
                {BRANCH_LABEL[row.branch] ?? row.branch}
              </span>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-[#5ef0c8] dark:text-[#3fb950] font-bold text-base leading-tight">{fmt(row.total)}</p>
                  <p className="text-white/60 dark:text-[#8b949e] text-xs">Total</p>
                </div>
                <div className="text-right">
                  <p className="text-white dark:text-[#e6edf3] font-bold text-base leading-tight">{fmt(row.new)}</p>
                  <p className="text-white/60 dark:text-[#8b949e] text-xs">New</p>
                </div>
                <div className="text-right">
                  <p className="text-white dark:text-[#e6edf3] font-bold text-base leading-tight">{fmt(row.contacted)}</p>
                  <p className="text-white/60 dark:text-[#8b949e] text-xs">Contacted</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop — existing table unchanged */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-5 py-2.5">Branch</th>
              <th scope="col" className="px-5 py-2.5">Total</th>
              <th scope="col" className="px-5 py-2.5">New</th>
              <th scope="col" className="px-5 py-2.5">Contacted</th>
              <th scope="col" className="px-5 py-2.5">Enrolled</th>
              <th scope="col" className="px-5 py-2.5">Conversion %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {data.map((row) => (
              <tr key={row.branch}>
                <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">
                  {BRANCH_LABEL[row.branch] ?? row.branch}
                </td>
                <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{fmt(row.total)}</td>
                <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{fmt(row.new)}</td>
                <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{fmt(row.contacted)}</td>
                <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{fmt(row.enrolled)}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${conversionColor(row.conversionRate)}`}
                  >
                    {row.conversionRate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Form source performance table                                             */
/* -------------------------------------------------------------------------- */

const FORM_LABEL: Record<string, string> = {
  hero: 'Hero card',
  full: 'Full enrollment',
  demo: 'Demo / sidebar',
  whatsapp_widget: 'WhatsApp widget',
};

function FormSourceTable({
  data,
}: {
  data: AnalyticsResponse['byFormSource'];
}): JSX.Element {
  return (
    <section className="overflow-x-auto rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-start justify-between gap-3 border-b border-[#e2e8f0] dark:border-gray-700 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Form Source Performance</h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Submissions and enrollment rate by form origin.
          </p>
        </div>
        <ExportCsvButton onClick={() => exportFormSourceCsv(data)} />
      </div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800/60 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-5 py-2.5">Form Type</th>
            <th scope="col" className="px-5 py-2.5">Submissions</th>
            <th scope="col" className="px-5 py-2.5">Enrolled</th>
            <th scope="col" className="px-5 py-2.5">Conversion %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {data.map((row) => (
            <tr key={row.formType}>
              <td className="px-5 py-3 font-medium capitalize text-gray-900 dark:text-white">
                {FORM_LABEL[row.formType] ?? row.formType}
              </td>
              <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{fmt(row.submissions)}</td>
              <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{fmt(row.enrolled)}</td>
              <td className="px-5 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${conversionColor(row.conversionRate)}`}
                >
                  {row.conversionRate.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  WhatsApp performance card                                                 */
/* -------------------------------------------------------------------------- */

function WhatsAppCard({
  data,
}: {
  data: AnalyticsResponse['whatsapp'];
}): JSX.Element {
  const cells: Array<{ label: string; value: string }> = [
    { label: 'Total Sent', value: fmt(data.total) },
    { label: 'Today', value: fmt(data.today) },
    { label: 'This Week', value: fmt(data.thisWeek) },
    { label: 'This Month', value: fmt(data.thisMonth) },
    {
      label: 'WhatsApp → Enrollment',
      value: conversionDisplay(data.enrolled, data.sampleSize, data.conversionRate),
    },
  ];
  return (
    <section className="rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">WhatsApp Performance</h2>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        Activity from the floating widget and per-lead WhatsApp sends.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cells.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-emerald-100 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-900/20 p-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              {c.label}
            </p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{c.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Daily 30-day chart                                                        */
/* -------------------------------------------------------------------------- */

function DailyChart({
  data,
}: {
  data: AnalyticsResponse['dailyLeads'];
}): JSX.Element {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <section className="rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Daily lead volume — last 30 days
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Submissions across all forms.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total: <span className="font-semibold text-gray-900 dark:text-white">{fmt(total)}</span>
          </p>
          <ExportCsvButton onClick={() => exportDailyCsv(data)} />
        </div>
      </header>

      {/* Scrollable wrapper — prevents 30 bars from squashing on small screens */}
      <div className="-mx-5 overflow-x-auto px-5">
        <div style={{ minWidth: '420px' }}>
          <div className="mt-6 grid h-[140px] items-end gap-[3px]" style={{ gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }}>
            {data.map((day) => {
              const heightPercent = (day.count / max) * 100;
              return (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count}`}
                  className="w-full rounded-t-sm bg-purple-500 transition-all"
                  style={{
                    height: day.count === 0 ? '4px' : `max(4px, ${heightPercent.toFixed(2)}%)`,
                    opacity: day.count === 0 ? 0.3 : 1,
                  }}
                  aria-hidden="true"
                />
              );
            })}
          </div>

          {/* Date axis — label every 5th day so the row stays readable. */}
          <div className="mt-2 grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }}>
            {data.map((day, i) => {
              const show = i % 5 === 0;
              const labelDate = new Date(day.date + 'T00:00:00');
              const label = labelDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              return (
                <div key={`label-${day.date}`} className="text-center">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {show ? label : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                  */
/* -------------------------------------------------------------------------- */

function SkeletonGrid(): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800"
          />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="h-64 animate-pulse rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800" />
        <div className="h-64 animate-pulse rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800" />
      </div>
      <div className="h-48 animate-pulse rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800" />
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Weekly email digest placeholder                                           */
/* -------------------------------------------------------------------------- */

function DigestPlaceholder(): JSX.Element {
  return (
    <section className="rounded-xl border-2 border-dashed border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
          aria-hidden="true"
        >
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Weekly email digest — coming soon
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Automatic weekly analytics report to admin email.
          </p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  CSV export helpers                                                        */
/* -------------------------------------------------------------------------- */

/** Compact button that mirrors the leads-page Export CSV style at a smaller
 *  size so it fits inside section headers without dominating them. */
function ExportCsvButton({ onClick }: { onClick: () => void }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-600"
    >
      <Download className="h-3.5 w-3.5" aria-hidden="true" />
      Export CSV
    </button>
  );
}

/** Wrap value in `"…"` and double any internal `"`. */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** YYYY-MM-DD in local time for the filename suffix. */
function todayIsoDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function downloadCsv(rows: string[][], filename: string): void {
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function exportBranchCsv(data: AnalyticsResponse['byBranch']): void {
  const rows: string[][] = [
    ['Branch', 'Total', 'New', 'Contacted', 'Enrolled', 'Conversion %'],
    ...data.map((b) => [
      BRANCH_LABEL[b.branch] ?? b.branch,
      String(b.total),
      String(b.new),
      String(b.contacted),
      String(b.enrolled),
      `${b.conversionRate.toFixed(1)}%`,
    ]),
  ];
  downloadCsv(rows, `coss-analytics-branch-${todayIsoDate()}.csv`);
}

function exportFormSourceCsv(
  data: AnalyticsResponse['byFormSource'],
): void {
  const rows: string[][] = [
    ['Form Type', 'Submissions', 'Enrolled', 'Conversion %'],
    ...data.map((f) => [
      FORM_LABEL[f.formType] ?? f.formType,
      String(f.submissions),
      String(f.enrolled),
      `${f.conversionRate.toFixed(1)}%`,
    ]),
  ];
  downloadCsv(rows, `coss-analytics-form-source-${todayIsoDate()}.csv`);
}

function exportDailyCsv(data: AnalyticsResponse['dailyLeads']): void {
  const rows: string[][] = [
    ['Date', 'Count'],
    ...data.map((d) => [d.date, String(d.count)]),
  ];
  downloadCsv(rows, `coss-analytics-daily-${todayIsoDate()}.csv`);
}

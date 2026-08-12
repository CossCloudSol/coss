'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle } from 'lucide-react';
import type {
  WhatsAppClicksAdminResponse,
  WhatsAppClickRow,
  ChannelBucket,
} from '@/app/api/admin/whatsapp-clicks/route';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const PAGE_TYPE_LABEL: Record<string, string> = {
  course: 'Course',
  category: 'Category',
  locality: 'Locality',
  blog: 'Blog',
  static: 'Static',
};

const CTA_TYPE_LABEL: Record<string, string> = {
  footer: 'Footer',
  hero: 'Hero',
  contact_page: 'Contact Page',
  free_demo: 'Free Demo',
  batches_page: 'Batches Page',
  batch: 'Batch Booking',
  job: 'Job Apply',
  locality: 'Locality Page',
  widget: 'Widget (desktop)',
  sticky: 'Widget (sticky bar)',
};

const DEVICE_LABEL: Record<string, string> = {
  mobile: 'Mobile',
  desktop: 'Desktop',
};

// Stat card light-mode backgrounds and dark-mode accent bars by index —
// matches /admin/call-clicks's palette so the "Leads" group reads as one system.
const STAT_LIGHT_BG: readonly string[] = ['bg-[#024c57]', 'bg-[#1d4ed8]', 'bg-[#03798a]', 'bg-[#7c3aed]'];
const STAT_DARK_ACCENT: readonly string[] = ['bg-emerald-500', 'bg-blue-500', 'bg-teal-500', 'bg-orange-500'];

const MOBILE_CARD_BG: readonly string[] = ['bg-[#024c57]', 'bg-[#1d4ed8]', 'bg-[#7c3aed]'];

type Granularity = 'day' | 'week' | 'month';

function fmt(n: number): string {
  return n.toLocaleString();
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function WhatsAppClicksAdminPage(): JSX.Element {
  const [data, setData] = useState<WhatsAppClicksAdminResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/whatsapp-clicks', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = (await res.json()) as WhatsAppClicksAdminResponse;
        if (!cancelled) setData(json);
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return;
        console.error('[WhatsAppClicksAdminPage] load failed:', err);
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
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
          <h1 className="text-xl font-semibold text-white">WhatsApp Click Log</h1>
          <p className="mt-1 text-sm text-white/60">
            Every tap on a wa.me link across the site — anonymous click intent, not a lead.
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

      {data === null && loading ? (
        <StatsSkeleton />
      ) : data === null ? null : (
        <>
          <StatsRow
            total={data.stats.total}
            thisMonth={data.stats.thisMonth}
            topCtaType={data.stats.topCtaType}
            topPageType={data.stats.topPageType}
          />

          <CtaTypeBreakdown data={data.stats.byCtaType} />

          <ChannelSeriesPanel series={data.series} />

          <RecentWhatsAppClicksTable rows={data.recent} />
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stats row                                                                 */
/* -------------------------------------------------------------------------- */

function StatsRow({
  total,
  thisMonth,
  topCtaType,
  topPageType,
}: {
  total: number;
  thisMonth: number;
  topCtaType: string;
  topPageType: string;
}): JSX.Element {
  const items: Array<{ label: string; value: string }> = [
    { label: 'Total WhatsApp Clicks', value: fmt(total) },
    { label: 'This Month', value: fmt(thisMonth) },
    { label: 'Top CTA', value: CTA_TYPE_LABEL[topCtaType] ?? topCtaType },
    { label: 'Top Page Type', value: PAGE_TYPE_LABEL[topPageType] ?? topPageType },
  ];

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <MessageCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" />
        WhatsApp Click Performance
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <div
            key={item.label}
            className={`relative overflow-hidden rounded-xl p-3 ${STAT_LIGHT_BG[i]} dark:border dark:border-gray-700 dark:bg-gray-800`}
          >
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
/*  CTA breakdown — the primary question this page answers: which button     */
/*  converts. Prominent, not a secondary filter.                             */
/* -------------------------------------------------------------------------- */

function CtaTypeBreakdown({
  data,
}: {
  data: WhatsAppClicksAdminResponse['stats']['byCtaType'];
}): JSX.Element {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <section className="rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Clicks by CTA</h2>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        Which WhatsApp button people actually tap — footer, hero, batch booking, the floating
        widget, and so on.
      </p>
      {data.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-[#e2e8f0] dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-4 text-center text-xs text-gray-500 dark:text-gray-400">
          No data yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {data.map((item) => {
            const widthPercent = (item.count / max) * 100;
            const share = total === 0 ? 0 : (item.count / total) * 100;
            return (
              <li key={item.ctaType}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="truncate text-gray-700 dark:text-gray-300">
                    {CTA_TYPE_LABEL[item.ctaType] ?? item.ctaType}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {fmt(item.count)}{' '}
                    <span className="font-normal text-gray-500 dark:text-gray-400">
                      ({share.toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
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
/*  Channel series panel — day/week/month, four SEPARATE series              */
/* -------------------------------------------------------------------------- */

const CHANNEL_META = {
  form: { label: 'Form Leads', color: 'bg-purple-500', dot: 'bg-purple-500' },
  whatsappLead: { label: 'WhatsApp Leads', color: 'bg-blue-500', dot: 'bg-blue-500' },
  callClick: { label: 'Call Clicks', color: 'bg-orange-500', dot: 'bg-orange-500' },
  whatsappClick: { label: 'WhatsApp Clicks', color: 'bg-emerald-500', dot: 'bg-emerald-500' },
} as const;

function ChannelSeriesPanel({
  series,
}: {
  series: WhatsAppClicksAdminResponse['series'];
}): JSX.Element {
  const [granularity, setGranularity] = useState<Granularity>('day');
  const buckets: ChannelBucket[] = series[granularity];

  const max = Math.max(...buckets.flatMap((b) => [b.form, b.whatsappLead, b.callClick, b.whatsappClick]), 1);
  const totals = buckets.reduce(
    (acc, b) => ({
      form: acc.form + b.form,
      whatsappLead: acc.whatsappLead + b.whatsappLead,
      callClick: acc.callClick + b.callClick,
      whatsappClick: acc.whatsappClick + b.whatsappClick,
    }),
    { form: 0, whatsappLead: 0, callClick: 0, whatsappClick: 0 },
  );

  const labelEvery = granularity === 'day' ? 5 : granularity === 'week' ? 2 : 1;

  return (
    <section className="rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Lead volume by channel
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Form, WhatsApp Leads, Call Clicks, and WhatsApp Clicks are separate series — never a
            combined total, since a click has no name or number and isn&apos;t a contactable lead.
          </p>
        </div>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5">
          {(['day', 'week', 'month'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGranularity(g)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
                granularity === g
                  ? 'bg-[#024c57] text-white dark:bg-[#03798a]'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </header>

      {/* Legend + per-series totals */}
      <div className="mt-4 flex flex-wrap gap-4">
        {(Object.keys(CHANNEL_META) as Array<keyof typeof CHANNEL_META>).map((key) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
            <span className={`h-2 w-2 rounded-full ${CHANNEL_META[key].dot}`} aria-hidden="true" />
            {CHANNEL_META[key].label}
            <span className="font-semibold text-gray-900 dark:text-white">{fmt(totals[key])}</span>
          </div>
        ))}
      </div>

      {/* Scrollable grouped-bar chart */}
      <div className="-mx-5 mt-4 overflow-x-auto px-5">
        <div style={{ minWidth: `${buckets.length * 32}px` }}>
          <div className="flex h-[140px] items-end gap-[6px]">
            {buckets.map((b) => (
              <div
                key={b.label}
                className="flex flex-1 items-end justify-center gap-[2px]"
                title={`${b.label} — Form: ${b.form}, WhatsApp Leads: ${b.whatsappLead}, Call: ${b.callClick}, WhatsApp Clicks: ${b.whatsappClick}`}
              >
                {(['form', 'whatsappLead', 'callClick', 'whatsappClick'] as const).map((key) => {
                  const value = b[key];
                  const heightPercent = (value / max) * 100;
                  return (
                    <div
                      key={key}
                      className={`w-[4px] rounded-t-sm ${CHANNEL_META[key].color} transition-all`}
                      style={{
                        height: value === 0 ? '3px' : `max(3px, ${heightPercent.toFixed(2)}%)`,
                        opacity: value === 0 ? 0.25 : 1,
                      }}
                      aria-hidden="true"
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-[6px]">
            {buckets.map((b, i) => (
              <div key={`label-${b.label}`} className="flex-1 text-center">
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {i % labelEvery === 0 ? b.label : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Recent WhatsApp clicks table                                             */
/* -------------------------------------------------------------------------- */

function RecentWhatsAppClicksTable({ rows }: { rows: WhatsAppClickRow[] }): JSX.Element {
  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="border-b border-gray-200 dark:border-gray-700 px-5 py-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent WhatsApp Clicks</h2>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Last 30 wa.me taps across the site.
        </p>
      </div>

      {/* Mobile cards (< lg) */}
      <div className="block lg:hidden p-3">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No WhatsApp clicks yet — taps on any WhatsApp button will appear here.
          </p>
        ) : (
          rows.map((row, i) => (
            <div
              key={row.id}
              className={`${MOBILE_CARD_BG[i % 3]} dark:bg-[#161b22] dark:border dark:border-[#21262d] rounded-xl p-3 mb-2`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-white dark:text-[#e6edf3] font-medium text-sm truncate pr-2">
                  {row.path}
                </span>
                <span className="bg-white/20 text-white text-xs rounded-full px-2 py-0.5 shrink-0">
                  {CTA_TYPE_LABEL[row.ctaType] ?? row.ctaType}
                </span>
              </div>
              <p className="text-white/70 dark:text-[#8b949e] text-xs mb-1.5">{row.phoneNumber}</p>
              <div className="flex flex-wrap gap-1">
                <span className="bg-white/20 text-white text-xs rounded-full px-2 py-0.5">
                  {PAGE_TYPE_LABEL[row.pageType] ?? row.pageType}
                </span>
                {row.courseSlug ? (
                  <span className="bg-white/20 text-white text-xs rounded-full px-2 py-0.5">{row.courseSlug}</span>
                ) : null}
                {row.branchKey ? (
                  <span className="bg-white/20 text-white text-xs rounded-full px-2 py-0.5">{row.branchKey}</span>
                ) : null}
                <span className="bg-white/20 text-white text-xs rounded-full px-2 py-0.5">
                  {DEVICE_LABEL[row.deviceType] ?? row.deviceType}
                </span>
                <span className={`text-xs rounded-full px-2 py-0.5 ${row.hadPrefill ? 'bg-emerald-400/30 text-white' : 'bg-white/20 text-white/70'}`}>
                  {row.hadPrefill ? 'Prefilled' : 'Bare'}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-white/50">
                {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Desktop table (lg+) */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <th scope="col" className="px-5 py-2.5">Path</th>
              <th scope="col" className="px-5 py-2.5">CTA</th>
              <th scope="col" className="px-5 py-2.5">Page Type</th>
              <th scope="col" className="px-5 py-2.5">Course / Branch</th>
              <th scope="col" className="px-5 py-2.5">Number</th>
              <th scope="col" className="px-5 py-2.5">Prefill</th>
              <th scope="col" className="px-5 py-2.5">Device</th>
              <th scope="col" className="px-5 py-2.5">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  No WhatsApp clicks yet — taps on any WhatsApp button will appear here.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/40">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-white max-w-[220px] truncate" title={row.path}>
                    {row.path}
                  </td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                    {CTA_TYPE_LABEL[row.ctaType] ?? row.ctaType}
                  </td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                    {PAGE_TYPE_LABEL[row.pageType] ?? row.pageType}
                  </td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                    {row.courseSlug ?? row.branchKey ?? <span className="text-gray-400 dark:text-gray-500">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-gray-700 dark:text-gray-300">{row.phoneNumber}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        row.hadPrefill
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {row.hadPrefill ? 'Prefilled' : 'Bare'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                    {DEVICE_LABEL[row.deviceType] ?? row.deviceType}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
          <div key={i} className="h-24 animate-pulse rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800" />
      <div className="h-64 animate-pulse rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800" />
      <div className="h-48 animate-pulse rounded-xl border border-[#e2e8f0] dark:border-gray-700 bg-white dark:bg-gray-800" />
    </div>
  );
}

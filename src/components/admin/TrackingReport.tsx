'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Loader2, MousePointerClick } from 'lucide-react';
import type { TrackingResponse, TrackingSeries } from '@/app/api/admin/tracking/route';
import { csvCell, withCsvBom } from '@/lib/csv';
import { DAY_MS, istDateKey, startOfTodayIST } from '@/lib/ist-date';

/* -------------------------------------------------------------------------- */
/*  /admin/tracking: leads and intent clicks for an IST date range.           */
/* -------------------------------------------------------------------------- */

const SERIES: ReadonlyArray<{ key: TrackingSeries; label: string; bar: string; card: string }> = [
  { key: 'leads', label: 'Leads', bar: 'bg-purple-500', card: 'bg-[#024c57]' },
  { key: 'corporate', label: 'Corporate leads', bar: 'bg-blue-500', card: 'bg-[#1d4ed8]' },
  { key: 'calls', label: 'Calls', bar: 'bg-[#b8531c]', card: 'bg-[#8f3f14]' },
  { key: 'whatsapp', label: 'WhatsApp', bar: 'bg-emerald-500', card: 'bg-[#0f5a2c]' },
  { key: 'demo', label: 'Demo clicks', bar: 'bg-amber-500', card: 'bg-[#03798a]' },
  { key: 'syllabus', label: 'Syllabus / brochure', bar: 'bg-teal-400', card: 'bg-[#7c3aed]' },
];

type Preset = 'today' | '7d' | '30d';

function presetRange(p: Preset): { from: string; to: string } {
  const today = startOfTodayIST();
  const back = p === 'today' ? 0 : p === '7d' ? 6 : 29;
  return { from: istDateKey(new Date(today.getTime() - back * DAY_MS)), to: istDateKey(today) };
}

function fmt(n: number): string {
  return n.toLocaleString('en-IN');
}

export function TrackingReport(): JSX.Element {
  const [range, setRange] = useState(() => presetRange('7d'));
  const [preset, setPreset] = useState<Preset | null>('7d');
  const [data, setData] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ from: range.from, to: range.to });
        const res = await fetch(`/api/admin/tracking?${qs.toString()}`, { signal: controller.signal, cache: 'no-store' });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = (await res.json()) as TrackingResponse;
        if (!cancelled) setData(json);
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return;
        console.error('[TrackingReport] load failed:', err);
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
  }, [range]);

  const pick = (p: Preset) => {
    setPreset(p);
    setRange(presetRange(p));
  };
  const setDate = (field: 'from' | 'to', value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    setPreset(null);
    setRange((r) => ({ ...r, [field]: value }));
  };

  const exportCsv = useCallback(() => {
    if (data) downloadCsv(data);
  }, [data]);

  return (
    <div className="space-y-4 bg-[#e6f4f6] dark:bg-[#0d1117]">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#024c57] px-5 py-4 dark:bg-[#0d1117]">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-white">
            <MousePointerClick className="h-5 w-5 text-[#5ef0c8]" aria-hidden="true" />
            Tracking
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Leads and every call, WhatsApp, demo and syllabus click, by the button and page they came from. IST days; spam excluded.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!data}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/35 bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25 disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </button>
      </header>

      {/* Range controls */}
      <section className="flex flex-wrap items-end gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
          {([['today', 'Today'], ['7d', '7 days'], ['30d', '30 days']] as const).map(([p, label]) => (
            <button
              key={p}
              type="button"
              onClick={() => pick(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                preset === p ? 'bg-[#024c57] text-white dark:bg-[#03798a]' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {(['from', 'to'] as const).map((field) => (
          <label key={field} className="flex flex-col text-xs text-gray-500 dark:text-gray-400">
            {field === 'from' ? 'From' : 'To'} (IST)
            <input
              type="date"
              value={range[field]}
              max={istDateKey(new Date())}
              onChange={(e) => setDate(field, e.target.value)}
              className="mt-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </label>
        ))}
        {loading ? <Loader2 className="mb-2 h-4 w-4 animate-spin text-gray-400" aria-label="Loading" /> : null}
      </section>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {data ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {SERIES.map((s) => (
              <div key={s.key} className={`relative overflow-hidden rounded-xl p-3 ${s.card} dark:border dark:border-gray-700 dark:bg-gray-800`}>
                <span className={`absolute left-0 top-0 hidden h-1 w-full dark:block ${s.bar}`} aria-hidden="true" />
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/65 dark:text-gray-400">{s.label}</p>
                <p className="text-2xl font-medium text-white">{fmt(data.totals[s.key])}</p>
              </div>
            ))}
          </div>

          <DailyChart data={data} />

          <div className="grid gap-4 lg:grid-cols-2">
            <DemoFunnel funnel={data.demoFunnel} />
            <Table
              title="Leads by source button"
              hint="The button clicked in the 30 minutes before the form."
              head={['Button', 'Section', 'Leads']}
              rows={data.leadsBySource.map((r) => [r.sourceCta, r.sourceLocation, fmt(r.leads)])}
            />
            <Table
              title="Top buttons"
              hint="Clicks per button and section, all kinds."
              head={['Button', 'Section', 'Kind', 'Clicks']}
              rows={data.topButtons.map((b) => [b.ctaId, b.location, b.kind, fmt(b.count)])}
            />
            <Table
              title="Top pages"
              hint="Where the clicks and form submissions happened."
              head={['Page', 'Clicks', 'Leads']}
              numeric={2}
              rows={data.topPages.map((p) => [p.path, fmt(p.clicks), fmt(p.leads)])}
            />
            <Table
              title="Top courses"
              hint="Clicks made on a course's own buttons."
              head={['Course', 'Clicks']}
              rows={data.topCourses.map((c) => [c.courseSlug, fmt(c.clicks)])}
            />
            <Table
              title="Traffic source"
              hint="utm_source, else the referring site, else direct."
              head={['Source', 'Clicks', 'Leads']}
              numeric={2}
              rows={data.trafficSources.map((s) => [s.source, fmt(s.clicks), fmt(s.leads)])}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Daily chart: one bar per type per IST day                                 */
/* -------------------------------------------------------------------------- */

function DailyChart({ data }: { data: TrackingResponse }): JSX.Element {
  const max = Math.max(1, ...data.daily.flatMap((d) => SERIES.map((s) => d[s.key])));
  const labelEvery = data.daily.length > 14 ? 5 : 1;
  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Daily, by type</h2>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Separate series: a click is an anonymous event, not a lead, so they are never added together.</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
            <span className={`h-2 w-2 rounded-full ${s.bar}`} aria-hidden="true" />
            {s.label}
          </span>
        ))}
      </div>
      <div className="-mx-5 mt-4 overflow-x-auto px-5">
        <div style={{ minWidth: `${data.daily.length * 44}px` }}>
          <div className="flex h-[150px] items-end gap-[6px]">
            {data.daily.map((d) => (
              <div
                key={d.date}
                className="flex h-full flex-1 items-end justify-center gap-[2px]"
                title={`${d.date}: ${SERIES.map((s) => `${s.label} ${d[s.key]}`).join(', ')}`}
              >
                {SERIES.map((s) => (
                  <div
                    key={s.key}
                    className={`w-[5px] rounded-t-sm ${s.bar}`}
                    style={{ height: d[s.key] === 0 ? '3px' : `max(3px, ${((d[s.key] / max) * 100).toFixed(2)}%)`, opacity: d[s.key] === 0 ? 0.25 : 1 }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-[6px]">
            {data.daily.map((d, i) => (
              <p key={d.date} className="flex-1 text-center text-[10px] text-gray-500 dark:text-gray-400">
                {i % labelEvery === 0 ? d.date.slice(5) : ''}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Demo funnel                                                               */
/* -------------------------------------------------------------------------- */

function DemoFunnel({ funnel }: { funnel: TrackingResponse['demoFunnel'] }): JSX.Element {
  const width = funnel.demoClicks === 0 ? 0 : Math.min(100, (funnel.demoLeads / funnel.demoClicks) * 100);
  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Demo funnel</h2>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        Demo clicks vs demo leads (demo forms, the /free-demo-class page, or a lead whose source button was book_demo).
      </p>
      <dl className="mt-4 space-y-3">
        <div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
            <dt>Demo clicks</dt>
            <dd className="font-semibold text-gray-900 dark:text-white">{fmt(funnel.demoClicks)}</dd>
          </div>
          <div className="mt-1 h-2 rounded-full bg-amber-500" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
            <dt>Demo leads</dt>
            <dd className="font-semibold text-gray-900 dark:text-white">
              {fmt(funnel.demoLeads)}
              {funnel.demoClicks > 0 ? <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">({funnel.rate}% of clicks)</span> : null}
            </dd>
          </div>
          <div className="mt-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
            <div className="h-2 rounded-full bg-purple-500" style={{ width: `${width}%` }} />
          </div>
        </div>
      </dl>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Simple ranked table                                                       */
/* -------------------------------------------------------------------------- */

/** `numeric`: how many trailing columns are counts (right-aligned). */
function Table({ title, hint, head, rows, numeric = 1 }: { title: string; hint: string; head: string[]; rows: string[][]; numeric?: number }): JSX.Element {
  const isNum = (i: number) => i >= head.length - numeric;
  return (
    <section className="min-w-0 rounded-xl border border-[#e2e8f0] bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Nothing in this range yet.</p>
      ) : (
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {head.map((h, i) => (
                <th key={h} className={`px-5 py-2 font-medium ${isNum(i) ? 'w-20 text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="border-t border-gray-100 dark:border-gray-700">
                {row.map((cell, i) => (
                  <td key={i} className={`truncate px-5 py-2 ${isNum(i) ? 'text-right font-medium text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`} title={cell}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  CSV                                                                       */
/* -------------------------------------------------------------------------- */

function downloadCsv(data: TrackingResponse): void {
  const blocks: string[][][] = [
    [['Range (IST)', data.range.from, data.range.to]],
    [['Date', ...SERIES.map((s) => s.label)], ...data.daily.map((d) => [d.date, ...SERIES.map((s) => String(d[s.key]))])],
    [['Total', ...SERIES.map((s) => String(data.totals[s.key]))]],
    [['Demo clicks', 'Demo leads', 'Rate %'], [String(data.demoFunnel.demoClicks), String(data.demoFunnel.demoLeads), String(data.demoFunnel.rate)]],
    [['Source button', 'Section', 'Leads'], ...data.leadsBySource.map((r) => [r.sourceCta, r.sourceLocation, String(r.leads)])],
    [['Button', 'Section', 'Kind', 'Clicks'], ...data.topButtons.map((b) => [b.ctaId, b.location, b.kind, String(b.count)])],
    [['Page', 'Clicks', 'Leads'], ...data.topPages.map((p) => [p.path, String(p.clicks), String(p.leads)])],
    [['Course', 'Clicks'], ...data.topCourses.map((c) => [c.courseSlug, String(c.clicks)])],
    [['Traffic source', 'Clicks', 'Leads'], ...data.trafficSources.map((s) => [s.source, String(s.clicks), String(s.leads)])],
  ];
  const csv = blocks.map((rows) => rows.map((row) => row.map(csvCell).join(',')).join('\r\n')).join('\r\n\r\n');
  const blob = new Blob([withCsvBom(csv)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `coss-tracking-${data.range.from}-to-${data.range.to}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

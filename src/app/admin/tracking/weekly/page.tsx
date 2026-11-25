import Link from 'next/link'
import { Download } from 'lucide-react'
import { loadWeeklyReport } from '@/lib/weekly-report-data'
import { AI_NOTE, changeText, reportRows, weekLabel } from '@/lib/weekly-report'
import PrintButton from './PrintButton'

// Live data every request. Access (analytics:view) is enforced by the admin middleware and layout.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Weekly report — Coss Cloud Solutions Admin',
  robots: { index: false, follow: false },
}

export default async function WeeklyReportPage(): Promise<JSX.Element> {
  const report = await loadWeeklyReport()
  const rows = reportRows(report)
  const prev = new Map(report.before.topCourses.map((c) => [c.courseSlug, c.clicks]))

  return (
    <div className="weekly-report space-y-4">
      {/* One printed page: the admin sidebar and these controls are hidden on paper. */}
      <style>{`@media print { aside, nav, .no-print { display: none !important; } .weekly-report { padding: 0 !important; } @page { margin: 14mm; } }`}</style>

      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#024c57] px-5 py-4 print:bg-white">
        <div>
          <h1 className="text-xl font-semibold text-white print:text-black">Weekly report</h1>
          <p className="mt-1 text-sm text-white/70 print:text-black">
            {weekLabel(report.current)} compared with {weekLabel(report.previous)}. Monday to Sunday, IST. Spam excluded.
          </p>
        </div>
        <div className="no-print flex gap-2">
          <a
            href="/api/admin/tracking/weekly?format=csv"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/35 bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            CSV
          </a>
          <a
            href="/api/admin/tracking/weekly?format=email"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-white/35 bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25"
          >
            Preview Monday email
          </a>
          <PrintButton />
        </div>
      </header>

      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-gray-500 dark:text-gray-400">
              <th className="py-1.5 font-medium">Metric</th>
              <th className="py-1.5 text-right font-medium">This week</th>
              <th className="py-1.5 text-right font-medium">Previous</th>
              <th className="py-1.5 text-right font-medium">Change</th>
            </tr>
          </thead>
          <tbody className="text-gray-900 dark:text-gray-100">
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-gray-100 dark:border-gray-700">
                <td className={`py-1.5 ${r.sub ? 'pl-6 text-gray-600 dark:text-gray-300' : 'font-semibold'}`}>{r.label}</td>
                <td className="py-1.5 text-right tabular-nums">{r.now}</td>
                <td className="py-1.5 text-right tabular-nums">{r.before}</td>
                <td className="py-1.5 text-right tabular-nums">{changeText(r.now, r.before)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Top 5 courses</h2>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Clicks (CTA, call and WhatsApp) on a course&apos;s own buttons.</p>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-gray-500 dark:text-gray-400">
              <th className="py-1.5 font-medium">Course</th>
              <th className="py-1.5 text-right font-medium">This week</th>
              <th className="py-1.5 text-right font-medium">Previous</th>
            </tr>
          </thead>
          <tbody className="text-gray-900 dark:text-gray-100">
            {report.now.topCourses.length === 0 ? (
              <tr><td colSpan={3} className="py-2 text-gray-500">No course-button clicks this week.</td></tr>
            ) : (
              report.now.topCourses.map((c) => (
                <tr key={c.courseSlug} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="py-1.5">{c.courseSlug}</td>
                  <td className="py-1.5 text-right tabular-nums">{c.clicks}</td>
                  <td className="py-1.5 text-right tabular-nums">{prev.get(c.courseSlug) ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <p className="text-xs text-gray-500 dark:text-gray-400">{AI_NOTE}</p>
      <p className="no-print text-xs">
        <Link href="/admin/tracking" className="text-[#024c57] underline dark:text-[#5ef0c8]">Back to Tracking</Link>
      </p>
    </div>
  )
}

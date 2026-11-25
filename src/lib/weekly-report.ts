/* -------------------------------------------------------------------------- */
/*  Weekly tracking report: the last full Monday-Sunday (IST) against the     */
/*  week before. Pure: rows in, numbers out (the database read is in          */
/*  weekly-report-data.ts), so it is unit-tested directly                     */
/*  (scripts/test/weekly-report.test.mjs). Counts only: no lead's name,       */
/*  phone or email ever enters a report, CSV or email.                        */
/* -------------------------------------------------------------------------- */

import { DAY_MS, IST_OFFSET_MS, istDateKey, startOfTodayIST } from '@/lib/ist-date'
import { REF_CHANNELS, channelFromTouch, type RefChannel } from '@/lib/wa-ref'
import { csvCell } from '@/lib/csv'
import { WEEKLY_REPORT_PATH, WEEKLY_REPORT_SITE } from '@/lib/report-config'

export interface WeekWindow {
  start: Date
  /** Exclusive: 00:00 IST the Monday after. */
  end: Date
  /** "2026-11-16" and "2026-11-22" (Monday and Sunday, IST). */
  from: string
  to: string
}

/** The last full Mon-Sun IST week before `now`, and the week before that. */
export function reportWeeks(now: Date = new Date()): { current: WeekWindow; previous: WeekWindow } {
  const today = startOfTodayIST(now)
  const dow = (new Date(today.getTime() + IST_OFFSET_MS).getUTCDay() + 6) % 7 // Mon=0..Sun=6
  const thisMonday = new Date(today.getTime() - dow * DAY_MS)
  const win = (start: Date): WeekWindow => {
    const end = new Date(start.getTime() + 7 * DAY_MS)
    return { start, end, from: istDateKey(start), to: istDateKey(new Date(end.getTime() - 1)) }
  }
  const curStart = new Date(thisMonday.getTime() - 7 * DAY_MS)
  return { current: win(curStart), previous: win(new Date(curStart.getTime() - 7 * DAY_MS)) }
}

export interface Touch {
  utmSource?: string | null
  utmMedium?: string | null
  referrer?: string | null
  gclid?: string | null
  fbclid?: string | null
}
export interface TimedRow {
  createdAt: Date
}
export interface ReportInput {
  leads: Array<TimedRow & Touch>
  corporate: TimedRow[]
  whatsapp: Array<TimedRow & Touch & { courseSlug?: string | null }>
  calls: Array<TimedRow & { courseSlug?: string | null }>
  /** CtaClick rows: kind is demo | syllabus | brochure_download | ... */
  cta: Array<TimedRow & { kind: string; courseSlug?: string | null }>
}

export interface WeekNumbers {
  leads: number
  corporate: number
  whatsapp: number
  whatsappByChannel: Record<RefChannel, number>
  calls: number
  demoClicks: number
  syllabusClicks: number
  aiLeads: number
  aiWhatsapp: number
  /** Top 5 courses by clicks on their own buttons (CTA, call and WhatsApp). */
  topCourses: Array<{ courseSlug: string; clicks: number }>
}

export interface WeeklyReport {
  current: WeekWindow
  previous: WeekWindow
  now: WeekNumbers
  before: WeekNumbers
}

/** Our own site is not a referrer: those visits count as direct. */
function channelOf(t: Touch): RefChannel {
  let referrer = t.referrer ?? null
  try {
    if (referrer && /(^|\.)cosscloudsol\.com$/.test(new URL(referrer).hostname)) referrer = null
  } catch {
    /* keep as is */
  }
  return channelFromTouch({
    utmSource: t.utmSource ?? undefined,
    utmMedium: t.utmMedium ?? undefined,
    gclid: t.gclid ?? undefined,
    fbclid: t.fbclid ?? undefined,
    referrer,
  })
}

const within = (d: Date, w: WeekWindow) => d >= w.start && d < w.end

export function summarizeWeek(input: ReportInput, w: WeekWindow): WeekNumbers {
  const leads = input.leads.filter((r) => within(r.createdAt, w))
  const wa = input.whatsapp.filter((r) => within(r.createdAt, w))
  const calls = input.calls.filter((r) => within(r.createdAt, w))
  const cta = input.cta.filter((r) => within(r.createdAt, w))

  const byChannel = Object.fromEntries(REF_CHANNELS.map((c) => [c.code, 0])) as Record<RefChannel, number>
  for (const r of wa) byChannel[channelOf(r)] += 1

  const courses = new Map<string, number>()
  for (const r of [...cta, ...calls, ...wa]) {
    if (r.courseSlug) courses.set(r.courseSlug, (courses.get(r.courseSlug) ?? 0) + 1)
  }
  const topCourses = Array.from(courses, ([courseSlug, clicks]) => ({ courseSlug, clicks }))
    .sort((a, b) => b.clicks - a.clicks || a.courseSlug.localeCompare(b.courseSlug))
    .slice(0, 5)

  return {
    leads: leads.length,
    corporate: input.corporate.filter((r) => within(r.createdAt, w)).length,
    whatsapp: wa.length,
    whatsappByChannel: byChannel,
    calls: calls.length,
    demoClicks: cta.filter((r) => r.kind === 'demo').length,
    syllabusClicks: cta.filter((r) => r.kind === 'syllabus' || r.kind === 'brochure_download').length,
    aiLeads: leads.filter((r) => channelOf(r) === 'A').length,
    aiWhatsapp: byChannel.A,
    topCourses,
  }
}

export function buildWeeklyReport(input: ReportInput, now: Date = new Date()): WeeklyReport {
  const { current, previous } = reportWeeks(now)
  return { current, previous, now: summarizeWeek(input, current), before: summarizeWeek(input, previous) }
}

/* ------------------------------ presentation ------------------------------ */

export interface ReportRow {
  label: string
  now: number
  before: number
  /** An indented sub-row (a channel under WhatsApp). */
  sub?: boolean
}

export function reportRows(r: WeeklyReport): ReportRow[] {
  const a = r.now
  const b = r.before
  return [
    { label: 'Leads (spam excluded)', now: a.leads, before: b.leads },
    { label: 'Corporate leads', now: a.corporate, before: b.corporate },
    { label: 'WhatsApp clicks', now: a.whatsapp, before: b.whatsapp },
    ...REF_CHANNELS.map((c) => ({ label: `${c.label} (${c.code})`, now: a.whatsappByChannel[c.code], before: b.whatsappByChannel[c.code], sub: true })),
    { label: 'Calls', now: a.calls, before: b.calls },
    { label: 'Demo clicks', now: a.demoClicks, before: b.demoClicks },
    { label: 'Syllabus / brochure clicks', now: a.syllabusClicks, before: b.syllabusClicks },
    { label: 'Leads from AI assistants', now: a.aiLeads, before: b.aiLeads },
    { label: 'WhatsApp clicks from AI assistants', now: a.aiWhatsapp, before: b.aiWhatsapp },
  ]
}

export function changeText(now: number, before: number): string {
  const d = now - before
  if (d === 0) return 'no change'
  const pct = before === 0 ? '' : ` (${d > 0 ? '+' : ''}${Math.round((d / before) * 100)}%)`
  return `${d > 0 ? '+' : ''}${d}${pct}`
}

export function weekLabel(w: WeekWindow): string {
  return `${w.from} to ${w.to}`
}

export const AI_NOTE = 'AI-assistant sessions are not recorded; only leads and WhatsApp clicks whose first touch was an AI assistant are counted. WhatsApp channels come from the stored UTM and referrer of each click.'

export function weeklyCsv(r: WeeklyReport): string {
  const lines: string[] = [['Metric', `This week (${weekLabel(r.current)})`, `Previous week (${weekLabel(r.previous)})`, 'Change'].map(csvCell).join(',')]
  for (const row of reportRows(r)) {
    // The change is our own number, so a minus sign is not a formula and is written as is (csvCell would prefix it).
    lines.push([csvCell(row.sub ? `  ${row.label}` : row.label), csvCell(row.now), csvCell(row.before), `"${row.now - row.before}"`].join(','))
  }
  lines.push('')
  lines.push(['Top courses (clicks on their own buttons)', 'This week', 'Previous week'].map(csvCell).join(','))
  const prev = new Map(r.before.topCourses.map((c) => [c.courseSlug, c.clicks]))
  for (const c of r.now.topCourses) lines.push([c.courseSlug, c.clicks, prev.get(c.courseSlug) ?? 0].map(csvCell).join(','))
  return lines.join('\r\n') + '\r\n'
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function weeklySubject(r: WeeklyReport): string {
  return `Coss weekly tracking report: ${weekLabel(r.current)}`
}

/** Plain HTML summary of the same numbers, with a link to the admin page. No personal data. */
export function weeklyEmailHtml(r: WeeklyReport): string {
  const td = 'padding:6px 10px;border-bottom:1px solid #eeeeee;font-size:14px;color:#222222;'
  const th = `${td}font-size:12px;color:#666666;`
  const rows = reportRows(r)
    .map(
      (row) =>
        `<tr><td style="${td}${row.sub ? 'padding-left:26px;color:#555555;' : 'font-weight:600;'}">${esc(row.label)}</td><td style="${td}text-align:right;">${row.now}</td><td style="${td}text-align:right;">${row.before}</td><td style="${td}text-align:right;">${esc(changeText(row.now, row.before))}</td></tr>`,
    )
    .join('')
  const prev = new Map(r.before.topCourses.map((c) => [c.courseSlug, c.clicks]))
  const courses = r.now.topCourses.length
    ? r.now.topCourses
        .map((c) => `<tr><td style="${td}">${esc(c.courseSlug)}</td><td style="${td}text-align:right;">${c.clicks}</td><td style="${td}text-align:right;">${prev.get(c.courseSlug) ?? 0}</td></tr>`)
        .join('')
    : `<tr><td colspan="3" style="${td}">No course-button clicks this week.</td></tr>`
  const link = `${WEEKLY_REPORT_SITE}${WEEKLY_REPORT_PATH}`
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(weeklySubject(r))}</title></head>
<body style="margin:0;padding:24px 12px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:8px;max-width:600px;width:100%;">
<tr><td style="background:#024c57;padding:18px 24px;"><span style="color:#5ef0c8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Coss Cloud Solutions: weekly report</span></td></tr>
<tr><td style="padding:24px;">
<h1 style="margin:0 0 4px;font-size:20px;color:#111111;">Week of ${esc(r.current.from)} to ${esc(r.current.to)}</h1>
<p style="margin:0 0 18px;font-size:13px;color:#666666;">Compared with ${esc(weekLabel(r.previous))}. Monday to Sunday, IST.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
<tr><th style="${th}text-align:left;">Metric</th><th style="${th}text-align:right;">This week</th><th style="${th}text-align:right;">Before</th><th style="${th}text-align:right;">Change</th></tr>
${rows}
</table>
<h2 style="margin:22px 0 6px;font-size:15px;color:#111111;">Top 5 courses (clicks on their own buttons)</h2>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
<tr><th style="${th}text-align:left;">Course</th><th style="${th}text-align:right;">This week</th><th style="${th}text-align:right;">Before</th></tr>
${courses}
</table>
<p style="margin:18px 0 0;font-size:12px;color:#777777;line-height:1.5;">${esc(AI_NOTE)}</p>
<p style="margin:20px 0 0;"><a href="${link}" style="display:inline-block;padding:11px 22px;background:#024c57;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">Open the full report</a></p>
</td></tr>
<tr><td style="padding:14px 24px;background:#f9f9f9;border-top:1px solid #eeeeee;"><p style="margin:0;font-size:12px;color:#999999;">Counts only; no lead details are included. Sent automatically every Monday 09:00 IST.</p></td></tr>
</table></td></tr></table></body></html>`
}

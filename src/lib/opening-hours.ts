// Opening hours in one shape, whichever source they come from: the Google
// listing (Places regularOpeningHours) or a centre's BranchSettings row.
// Dependency-free (unit-tested in scripts/test/opening-hours.test.mjs).

export const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
export type Weekday = (typeof WEEK)[number]

/** One opening span, schema.org style: "HH:MM" 24-hour. */
export type HoursPeriod = { day: Weekday; opens: string; closes: string }

/** Consecutive days with the same hours, ready to show: { days: 'Mon–Sat', time: '9:00 AM – 7:00 PM' }. */
export type HoursGroup = { days: string; time: string }

const SHORT: Record<Weekday, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
}

function dayIndex(name: string): number {
  const n = name.trim().toLowerCase()
  return n.length >= 3 ? WEEK.findIndex((d) => d.toLowerCase().startsWith(n.slice(0, 3))) : -1
}

const HHMM = /^([01]\d|2[0-4]):([0-5]\d)$/

/**
 * BranchSettings → periods. workingDays is a range ("Monday-Sunday",
 * "Mon–Sat"), a list ("Mon, Wed, Fri") or one day; open/close are "HH:MM".
 * Anything unreadable gives [] (the caller shows no hours rather than wrong ones).
 */
export function periodsFromSettings(workingDays: string, open: string, close: string): HoursPeriod[] {
  if (!HHMM.test(open?.trim() ?? '') || !HHMM.test(close?.trim() ?? '')) return []
  const days = new Set<number>()
  for (const part of (workingDays ?? '').split(/[,&/]| and /i)) {
    const [a, b] = part.split(/\s*[-–—]\s*|\s+to\s+/i)
    const from = dayIndex(a ?? '')
    if (from < 0) return []
    if (b === undefined) { days.add(from); continue }
    const to = dayIndex(b)
    if (to < 0) return []
    for (let i = from; ; i = (i + 1) % 7) { days.add(i); if (i === to) break }
  }
  return WEEK.filter((_, i) => days.has(i)).map((day) => ({ day, opens: open.trim(), closes: close.trim() }))
}

/** "07:00" → "7:00 AM", "21:30" → "9:30 PM", "23:59" → "11:59 PM", "12:00" → "12:00 PM". */
export function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const hour = h % 24
  return `${hour % 12 === 0 ? 12 : hour % 12}:${String(m).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`
}

/** Monday-first groups of consecutive days that share the same hours; days without a period are "Closed". */
export function groupPeriods(periods: HoursPeriod[]): HoursGroup[] {
  if (periods.length === 0) return []
  const timeFor = (day: Weekday) => {
    const spans = periods.filter((p) => p.day === day).sort((a, b) => a.opens.localeCompare(b.opens))
    if (spans.length === 0) return 'Closed'
    if (spans.length === 1 && spans[0].opens === '00:00' && spans[0].closes === '23:59') return 'Open 24 hours'
    return spans.map((p) => `${to12h(p.opens)} – ${to12h(p.closes)}`).join(', ')
  }
  const groups: Array<{ from: Weekday; to: Weekday; time: string }> = []
  for (const day of WEEK) {
    const time = timeFor(day)
    const last = groups[groups.length - 1]
    if (last && last.time === time) last.to = day
    else groups.push({ from: day, to: day, time })
  }
  return groups.map((g) => ({ days: g.from === g.to ? SHORT[g.from] : `${SHORT[g.from]}–${SHORT[g.to]}`, time: g.time }))
}

/** schema.org openingHoursSpecification, one entry per distinct span. */
export function openingHoursSpecification(periods: HoursPeriod[]) {
  const bySpan = new Map<string, Weekday[]>()
  for (const p of periods) {
    const key = `${p.opens}|${p.closes}`
    bySpan.set(key, [...(bySpan.get(key) ?? []), p.day])
  }
  return [...bySpan].map(([key, days]) => {
    const [opens, closes] = key.split('|')
    return { '@type': 'OpeningHoursSpecification', dayOfWeek: days, opens, closes }
  })
}

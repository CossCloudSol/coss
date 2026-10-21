import { DAY_MS, istDateKey, startOfTodayIST } from '@/lib/ist-date';

/* The /admin/tracking date range: inclusive IST calendar dates. Shared by the API and its tests. */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 366;

/** 00:00 IST on an IST calendar date "YYYY-MM-DD". */
function istMidnight(date: string): Date {
  return new Date(`${date}T00:00:00+05:30`);
}

/** Inclusive IST date range from ?from=&to= (defaults to the last 7 days). */
export function parseTrackingRange(from: string | null, to: string | null, now: Date = new Date()): { start: Date; end: Date; from: string; to: string; days: number } | null {
  const today = istDateKey(now);
  const toKey = to && DATE_RE.test(to) ? to : today;
  const fromKey = from && DATE_RE.test(from) ? from : istDateKey(new Date(startOfTodayIST(now).getTime() - 6 * DAY_MS));
  const start = istMidnight(fromKey);
  const end = new Date(istMidnight(toKey).getTime() + DAY_MS); // exclusive
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;
  const days = Math.round((end.getTime() - start.getTime()) / DAY_MS);
  if (days > MAX_DAYS) return null;
  return { start, end, from: fromKey, to: toKey, days };
}

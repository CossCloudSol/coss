// Calendar days in India Standard Time, whatever the server's TZ (Vercel runs in UTC).
// IST is UTC+05:30 all year (no daylight saving), so a fixed offset is exact: shift the
// instant by +05:30, read the UTC calendar fields, and shift the boundary back.

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

/** The instant moved so its UTC fields read as the IST wall clock. */
function istWall(d: Date): Date {
  return new Date(d.getTime() + IST_OFFSET_MS);
}

/** 00:00 IST of the IST day `d` falls in. */
export function startOfDayIST(d: Date): Date {
  const w = istWall(d);
  return new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate()) - IST_OFFSET_MS);
}

/** 00:00 IST today. */
export function startOfTodayIST(now: Date = new Date()): Date {
  return startOfDayIST(now);
}

/** 00:00 IST on the 1st of the IST month `d` falls in; `monthsBack` moves earlier by whole months. */
export function startOfMonthIST(d: Date, monthsBack = 0): Date {
  const w = istWall(d);
  return new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth() - monthsBack, 1) - IST_OFFSET_MS);
}

/** 00:00 IST, `days` IST days before the day `d` falls in (days = 6 gives a 7-day window ending today). */
export function daysBeforeIST(d: Date, days: number): Date {
  return new Date(startOfDayIST(d).getTime() - days * DAY_MS);
}

/** "YYYY-MM-DD" of the IST calendar day. */
export function istDateKey(d: Date): string {
  return istWall(d).toISOString().slice(0, 10);
}

/** "YYYY-MM" of the IST calendar month. */
export function istMonthKey(d: Date): string {
  return istWall(d).toISOString().slice(0, 7);
}

/** ISO 8601 week of the IST calendar day, e.g. "2026-W32". */
export function istWeekKey(d: Date): string {
  const w = istWall(d);
  const date = new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date.getTime() - firstThursday.getTime()) / DAY_MS - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

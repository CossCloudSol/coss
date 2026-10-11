// Batch times in the menu: one consistent format, whatever the admin typed.
// "Mon To Fri 10AM TO 11AM" -> "10–11 AM"; "10AM TO 12PM" -> "10 AM–12 PM";
// "9:30 AM - 11 AM" -> "9:30–11 AM"; "10AM" -> "10 AM". Days are dropped
// ("branch and time only"). Dependency-free (unit-tested).

type Clock = { h: number; m: number; mer: 'AM' | 'PM' };

const TIME = String.raw`(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?`;
const SEP = String.raw`\s*(?:to|-|–|—|till|until)\s*`;
const RANGE = new RegExp(`${TIME}${SEP}${TIME}`, 'i');
const SINGLE = new RegExp(TIME, 'i');

function clock(h: string, m: string | undefined, mer: string): Clock {
  return { h: Number(h), m: m ? Number(m) : 0, mer: mer.toLowerCase() === 'a' ? 'AM' : 'PM' };
}
const num = (c: Clock) => (c.m ? `${c.h}:${String(c.m).padStart(2, '0')}` : String(c.h));

/** The time part of a batch schedule, or '' when no time can be read. */
export function formatBatchTime(schedule: string | null | undefined): string {
  const s = (schedule ?? '').trim();
  if (!s) return '';
  const r = s.match(RANGE);
  if (r) {
    const a = clock(r[1], r[2], r[3]);
    const b = clock(r[4], r[5], r[6]);
    return a.mer === b.mer ? `${num(a)}–${num(b)} ${b.mer}` : `${num(a)} ${a.mer}–${num(b)} ${b.mer}`;
  }
  const one = s.match(SINGLE);
  if (one) {
    const c = clock(one[1], one[2], one[3]);
    return `${num(c)} ${c.mer}`;
  }
  return '';
}

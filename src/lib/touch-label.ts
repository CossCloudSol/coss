// "First → last touch" label for the admin leads table and CSV. A lead from before the
// attribution release has no last touch, and a visitor whose two touches are the same
// source shows that source once.

/** 'direct' when a touch has no source. */
export function touchSource(source: string | null | undefined): string {
  const s = (source ?? '').trim();
  return s === '' ? 'direct' : s;
}

/** 'google' | 'direct → test' (first touch → last touch, only when the last touch differs). */
export function touchLabel(first: string | null | undefined, last: string | null | undefined): string {
  const f = touchSource(first);
  if ((last ?? '').trim() === '') return f;
  const l = touchSource(last);
  return l.toLowerCase() === f.toLowerCase() ? f : `${f} → ${l}`;
}

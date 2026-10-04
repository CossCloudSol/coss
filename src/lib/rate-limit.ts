/**
 * In-memory sliding-window rate limiter, per server instance (the same model
 * as the lead form limits). Enough to stop one client inflating a counter or
 * flooding a form; not a global quota across instances.
 */
export function createRateLimiter({ max, windowMs, maxKeys = 10_000 }: { max: number; windowMs: number; maxKeys?: number }) {
  const hits = new Map<string, number[]>();
  return {
    /** Records a hit for key; false when key is over the limit (the hit is not recorded). */
    allow(key: string, now = Date.now()): boolean {
      const cutoff = now - windowMs;
      const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);
      if (recent.length >= max) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      if (hits.size > maxKeys) for (const [k, ts] of hits) if (ts.every((t) => t <= cutoff)) hits.delete(k);
      return true;
    },
  };
}

/** First address in x-forwarded-for (set by Vercel), or 'unknown'. */
export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

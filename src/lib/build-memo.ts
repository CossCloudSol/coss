/**
 * Memoises a read-only query for the duration of one `next build`, per build
 * worker. Outside the build (ISR regeneration, requests) it is a plain
 * pass-through, so page freshness is exactly what it was before.
 *
 * Why: prerendering ~400 pages ran the same queries hundreds of times (the
 * published-course pool on every blog post, each course's batches on both of
 * its URLs, landing-page siblings…). Through the Supabase transaction pooler
 * every query is BEGIN / DEALLOCATE ALL / query / COMMIT, i.e. four round
 * trips from the build machine to the database, so repeats dominated build
 * time. Concurrent callers share one in-flight promise; a failed query is
 * forgotten so the next caller retries.
 */

const memo = new Map<string, Promise<unknown>>();

function isProductionBuild(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

export function memoDuringBuild<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (!isProductionBuild()) return load();
  const hit = memo.get(key) as Promise<T> | undefined;
  if (hit) return hit;
  const pending = load();
  memo.set(key, pending);
  pending.catch(() => memo.delete(key));
  return pending;
}

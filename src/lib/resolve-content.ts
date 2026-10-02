/**
 * Page content from the database first, then an optional file fallback.
 *
 *   DB returns a row          → { source: 'db', value }
 *   DB returns null (no row)  → file fallback → { source: 'file', value } or null
 *   DB throws                 → the error propagates. Never a 404.
 *
 * Only a definite "not found" may become notFound(): a transient DB error
 * (pooler hiccup, timeout) that turns into notFound() gets cached as a 404
 * for the whole revalidate window. Thrown instead, a build fails loudly and
 * an ISR regeneration keeps serving the last good page.
 *
 * Dependency-free so `node --test` can import it (scripts/test).
 */
export type Resolved<D, F> = { source: 'db'; value: D } | { source: 'file'; value: F } | null;

export async function resolveDbThenFile<D, F = never>(
  fromDb: () => Promise<D | null>,
  fromFile?: () => Promise<F | null>,
): Promise<Resolved<D, F>> {
  const row = await fromDb(); // no try/catch on purpose: DB errors must not read as "not found"
  if (row !== null && row !== undefined) return { source: 'db', value: row };
  if (!fromFile) return null;
  const file = await fromFile();
  return file !== null && file !== undefined ? { source: 'file', value: file } : null;
}

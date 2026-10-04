import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, type SessionData } from '@/lib/session';
import { requiredAccess, isAllowed, type Access } from '@/lib/admin-access';
import { ALL_PERMISSIONS, type AdminRole } from '@/lib/permissions';

/**
 * Second layer behind the middleware, for /api/admin/* handlers and the admin
 * layout (Node runtime). The middleware trusts the session cookie; this
 * re-reads the user from the database, so a disabled user or a changed role
 * takes effect on the next request (after the short cache below), not when
 * the cookie expires.
 */

export interface LiveAdmin {
  role: AdminRole;
  permissions: readonly string[];
}

const CACHE_MS = 30_000;
const cache = new Map<string, { at: number; user: LiveAdmin | null }>();

/** Test hook: clears the per-process user cache. */
export function clearAdminCache(): void {
  cache.clear();
}

/**
 * The caller's current role and permissions, or null when the session no
 * longer stands (not signed in, user deleted or disabled). The env-var super
 * admin has no database row of its own (a row with the same email only lends
 * its id for push subscriptions), so it is recognised from the session.
 */
export async function liveAdmin(session: SessionData, now = Date.now()): Promise<LiveAdmin | null> {
  if (!session.isAdmin) return null;
  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isEnvSuperAdmin = session.role === 'SUPER_ADMIN' && (!session.userId || (!!envEmail && session.email === envEmail));
  if (isEnvSuperAdmin) return { role: 'SUPER_ADMIN', permissions: ALL_PERMISSIONS };
  if (!session.userId) return null;

  const hit = cache.get(session.userId);
  if (hit && now - hit.at < CACHE_MS) return hit.user;
  const row = await prisma.adminUser.findUnique({
    where: { id: session.userId },
    select: { isActive: true, role: true, permissions: true },
  });
  const user: LiveAdmin | null = row && row.isActive ? { role: row.role as AdminRole, permissions: row.permissions } : null;
  cache.set(session.userId, { at: now, user });
  if (cache.size > 500) for (const [k, v] of cache) if (now - v.at >= CACHE_MS) cache.delete(k);
  return user;
}

/**
 * Use at the top of every /api/admin/* handler:
 *   const guard = await requireAdmin(req)
 *   if (guard instanceof Response) return guard
 * The access needed comes from the same table the middleware uses (path and
 * method); pass one explicitly only for a stricter check. Fails closed: a
 * database error answers 503, never lets the request through.
 */
export async function requireAdmin(
  req: NextRequest,
  access: Access = requiredAccess(req.nextUrl.pathname, req.method),
): Promise<({ session: SessionData } & LiveAdmin) | NextResponse> {
  const session = await getSession(req, NextResponse.next());
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let live: LiveAdmin | null;
  try {
    live = await liveAdmin(session);
  } catch (err) {
    console.error('[admin-guard] user check failed', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
  if (!live) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAllowed(access, live)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return { session, ...live };
}

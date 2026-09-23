import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { getAdminStats } from '@/lib/admin-stats';

export type { AdminStatsResponse } from '@/lib/admin-stats';

// Prisma uses Node built-ins — cannot run on the Edge runtime.
export const runtime = 'nodejs';
// Admin data is request-scoped; never let Next cache it.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  // Session check — middleware guards `/admin/*` but `/api/admin/*` is not
  // covered by that matcher, so we validate here too.
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    return NextResponse.json(await getAdminStats());
  } catch (err) {
    console.error('[GET /api/admin/stats] DB error:', err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}

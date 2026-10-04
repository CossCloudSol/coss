import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { getAdminStats } from '@/lib/admin-stats';

export type { AdminStatsResponse } from '@/lib/admin-stats';

// Prisma uses Node built-ins — cannot run on the Edge runtime.
export const runtime = 'nodejs';
// Admin data is request-scoped; never let Next cache it.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  // Second layer behind the middleware: a fresh user check plus the area permission.
  const guard = await requireAdmin(req);
  if (guard instanceof Response) return guard;

  try {
    return NextResponse.json(await getAdminStats());
  } catch (err) {
    console.error('[GET /api/admin/stats] DB error:', err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { markAllAsRead, sessionRoleToFilter } from '@/lib/notifications';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard instanceof Response) return guard;
  const session = guard.session;

  const userRole = sessionRoleToFilter(session.role);
  await markAllAsRead(userRole);
  return NextResponse.json({ success: true });
}

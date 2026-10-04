import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { deleteAllForRole, sessionRoleToFilter } from '@/lib/notifications';

export const runtime = 'nodejs';

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard instanceof Response) return guard;
  const session = guard.session;

  const userRole = sessionRoleToFilter(session.role);
  const result = await deleteAllForRole(userRole);

  if (result.count === 0) {
    console.log(`[DELETE /api/admin/notifications/clear-all] no notifications matched for role=${userRole ?? 'all'}`);
  } else {
    console.log(`[DELETE /api/admin/notifications/clear-all] deleted ${result.count} notification(s) for role=${userRole ?? 'all'}`);
  }

  return NextResponse.json({ success: true, deletedCount: result.count });
}

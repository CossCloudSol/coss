import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { deleteAllForRole, sessionRoleToFilter } from '@/lib/notifications';

export const runtime = 'nodejs';

export async function DELETE(req: NextRequest) {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    console.log('[DELETE /api/admin/notifications/clear-all] rejected: no admin session');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = sessionRoleToFilter(session.role);
  const result = await deleteAllForRole(userRole);

  if (result.count === 0) {
    console.log(`[DELETE /api/admin/notifications/clear-all] no notifications matched for role=${userRole ?? 'all'}`);
  } else {
    console.log(`[DELETE /api/admin/notifications/clear-all] deleted ${result.count} notification(s) for role=${userRole ?? 'all'}`);
  }

  return NextResponse.json({ success: true, deletedCount: result.count });
}

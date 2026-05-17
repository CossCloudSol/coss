import { NextResponse, type NextRequest } from 'next/server';
import { withAdminAuth, getSession } from '@/lib/session';
import { prisma as db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { ROLE_PERMISSIONS } from '@/lib/permissions';

type Ctx = { params: { id: string } };

// No role in session = old cookie (env-var admin) → always SUPER_ADMIN.
// DB users always get a role written on login, so undefined = env-var path.
function isSuperAdmin(session: { role?: string }): boolean {
  return !session.role || session.role === 'SUPER_ADMIN';
}

export const PATCH = withAdminAuth<{ id: string }>(async (req, ctx) => {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = (ctx as Ctx).params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (typeof b.name === 'string' && b.name.trim()) data.name = b.name.trim();
  if (typeof b.email === 'string' && b.email.trim()) data.email = b.email.trim().toLowerCase();
  if (typeof b.isActive === 'boolean') data.isActive = b.isActive;

  if (typeof b.role === 'string') {
    if (!['SUPER_ADMIN', 'ADMISSIONS_SALES', 'SUPPORT_HELPDESK'].includes(b.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    data.role = b.role;
    // Auto-set permissions when role changes and no custom permissions provided
    if (!Array.isArray(b.permissions)) {
      data.permissions = ROLE_PERMISSIONS[b.role] ?? [];
    }
  }

  if (Array.isArray(b.permissions)) {
    data.permissions = (b.permissions as unknown[]).filter((p): p is string => typeof p === 'string');
  }

  if (typeof b.password === 'string' && b.password.length > 0) {
    if (b.password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    data.passwordHash = await hashPassword(b.password);
  }

  try {
    const user = await db.adminUser.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
});

export const DELETE = withAdminAuth<{ id: string }>(async (req, ctx) => {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = (ctx as Ctx).params;

  // Prevent self-deletion
  if (session.userId && session.userId === id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
  }

  try {
    await db.adminUser.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
});

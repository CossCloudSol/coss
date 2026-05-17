import { NextResponse, type NextRequest } from 'next/server';
import { withAdminAuth, getSession } from '@/lib/session';
import { prisma as db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { ROLE_PERMISSIONS, type Permission } from '@/lib/permissions';

// No role in session = old cookie (env-var admin) → always SUPER_ADMIN.
// DB users always get a role written on login, so undefined = env-var path.
function isSuperAdmin(session: { role?: string }): boolean {
  return !session.role || session.role === 'SUPER_ADMIN';
}

export const GET = withAdminAuth(async (req) => {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const adminUserModel = (db as unknown as Record<string, unknown>).adminUser;
    if (!adminUserModel) {
      return NextResponse.json(
        { error: 'Prisma client is outdated — stop the dev server, run `npx prisma generate`, then restart.' },
        { status: 503 },
      );
    }

    const users = await db.adminUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

export const POST = withAdminAuth(async (req) => {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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

  const name = typeof b.name === 'string' ? b.name.trim() : '';
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const password = typeof b.password === 'string' ? b.password : '';
  const role = typeof b.role === 'string' ? b.role : 'ADMISSIONS_SALES';
  const permissions: string[] = Array.isArray(b.permissions)
    ? (b.permissions as unknown[]).filter((p): p is string => typeof p === 'string')
    : (ROLE_PERMISSIONS[role] ?? []) as Permission[];

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'name, email, and password are required' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }
  if (!['SUPER_ADMIN', 'ADMISSIONS_SALES', 'SUPPORT_HELPDESK'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  try {
    const existing = await db.adminUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await db.adminUser.create({
      data: {
        name,
        email,
        passwordHash,
        role: role as 'SUPER_ADMIN' | 'ADMISSIONS_SALES' | 'SUPPORT_HELPDESK',
        permissions,
        isActive: true,
      },
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

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

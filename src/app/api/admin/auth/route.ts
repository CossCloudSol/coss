import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/session';
import { prisma as db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { ALL_PERMISSIONS } from '@/lib/permissions';

// Brute-force protection: max 10 *failed* attempts per IP per 15 minutes.
// Only active in production — dev environments have no reverse proxy so every
// request resolves to 'unknown', which would lock out the developer after 10
// test attempts.
const LOGIN_RATE_LIMIT_MAX = 10;
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const failedAttempts: Map<string, number[]> = new Map();

function loginClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (!fwd) return 'unknown';
  const first = fwd.split(',')[0]?.trim();
  return first || 'unknown';
}

/** Returns true when this IP has exceeded the failed-login threshold. */
function isLoginRateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - LOGIN_RATE_LIMIT_WINDOW_MS;
  const recent = (failedAttempts.get(ip) ?? []).filter((t) => t > cutoff);
  failedAttempts.set(ip, recent); // prune expired entries in-place
  return recent.length >= LOGIN_RATE_LIMIT_MAX;
}

/** Record one failed login attempt for this IP. */
function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const cutoff = now - LOGIN_RATE_LIMIT_WINDOW_MS;
  const recent = (failedAttempts.get(ip) ?? []).filter((t) => t > cutoff);
  recent.push(now);
  failedAttempts.set(ip, recent);
  // Prevent unbounded map growth on long-running servers.
  if (failedAttempts.size > 5_000) {
    for (const [storedIp, timestamps] of failedAttempts) {
      if (timestamps.every((t) => t <= cutoff)) failedAttempts.delete(storedIp);
    }
  }
}

/**
 * Constant-time string equality to prevent timing side-channel attacks.
 * Always runs the same amount of work regardless of where strings differ.
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Lengths differ → always false, but still call timingSafeEqual to avoid
  // a short-circuit that would reveal the length mismatch via timing.
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(Buffer.alloc(bufA.length), Buffer.alloc(bufA.length));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * POST /api/admin/auth
 * Body: { email: string; password: string }
 *
 * Auth priority:
 *   1. Env-var superadmin: if email+password match ADMIN_EMAIL+ADMIN_PASSWORD,
 *      grant SUPER_ADMIN immediately (takes priority over any DB user with
 *      the same email — prevents User Roles panel from locking out the superadmin).
 *   2. DB user: look up AdminUser by email, verify hashed password.
 *   3. Fallback error if ADMIN_PASSWORD is not configured.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const ip = loginClientIp(req);
  const isProd = process.env.NODE_ENV === 'production';

  // In production, reject IPs that have already exceeded the failed-login limit
  // before we do any DB work or JSON parsing.
  if (isProd && isLoginRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many failed login attempts. Try again later.' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const email =
    typeof body === 'object' && body !== null && 'email' in body &&
    typeof (body as { email: unknown }).email === 'string'
      ? (body as { email: string }).email.trim().toLowerCase()
      : '';

  const submitted =
    typeof body === 'object' && body !== null && 'password' in body &&
    typeof (body as { password: unknown }).password === 'string'
      ? (body as { password: string }).password
      : '';

  if (submitted.length === 0) {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 });
  }

  // Helper: return a 401 and record the failure for rate-limiting.
  function fail(): Response {
    if (isProd) recordFailedLogin(ip);
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // --- 2. Env-var superadmin fallback (checked first for env-var admin email) ---
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // If the submitted email matches ADMIN_EMAIL and the password matches ADMIN_PASSWORD,
  // grant access immediately — before the DB check. This ensures the env-var superadmin
  // can always log in even if a DB user with the same email was created (e.g. via the
  // User Roles panel) that would otherwise shadow the env-var credentials.
  if (adminPassword) {
    const envEmailMatch = adminEmail
      ? timingSafeStringEqual(email, adminEmail.toLowerCase())
      : email.length === 0;
    if (envEmailMatch && timingSafeStringEqual(submitted, adminPassword)) {
      const res = NextResponse.json({ ok: true });
      const session = await getSession(req, res);
      session.isAdmin = true;
      session.role = 'SUPER_ADMIN';
      session.permissions = ALL_PERMISSIONS;
      if (adminEmail) session.email = adminEmail.toLowerCase();
      await session.save();
      return res;
    }
  }

  // --- 1. DB user lookup ---
  if (email.length > 0) {
    try {
      const user = await db.adminUser.findUnique({ where: { email } });
      if (user && !user.isActive) {
        return NextResponse.json(
          { error: 'Your account has been disabled. Contact your administrator.' },
          { status: 403 },
        );
      }
      if (user && user.isActive) {
        const valid = await verifyPassword(submitted, user.passwordHash);
        if (valid) {
          const res = NextResponse.json({ ok: true });
          const session = await getSession(req, res);
          session.isAdmin = true;
          session.userId = user.id;
          session.name = user.name;
          session.email = user.email;
          session.role = user.role as 'SUPER_ADMIN' | 'ADMISSIONS_SALES' | 'SUPPORT_HELPDESK';
          session.permissions = user.permissions;
          await session.save();
          return res;
        }
        // DB user found but password wrong and not the env-var admin → reject.
        return fail();
      }
    } catch {
      // DB unavailable — fall through to env fallback.
    }
  }

  // If we reach here, no credentials matched.
  // Surface a config error if ADMIN_PASSWORD is not set at all.
  if (!adminPassword) {
    return NextResponse.json({ error: 'Server is not configured for admin login' }, { status: 500 });
  }

  return fail();
}

/**
 * GET /api/admin/auth
 * Logs out the current admin and redirects to /admin/login.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const loginUrl = new URL('/admin/login', req.url);
  const res = NextResponse.redirect(loginUrl);
  const session = await getSession(req, res);
  session.destroy();
  return res;
}

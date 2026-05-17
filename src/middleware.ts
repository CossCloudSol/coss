import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/session';

/**
 * Maps an admin route prefix to the permission key that grants access.
 * Longest-prefix match wins (entries are checked in order).
 * Routes NOT listed here are accessible to any authenticated admin.
 */
const ROUTE_PERMISSIONS: ReadonlyArray<readonly [string, string | null]> = [
  ['/admin/leads',     'leads:view'],
  ['/admin/corporate', 'corporate:view'],
  ['/admin/whatsapp',  'whatsapp:view'],
  ['/admin/seo',       'seo:view'],
  ['/admin/analytics', 'analytics:view'],
  ['/admin/topbar',    'topbar:view'],
  ['/admin/announcement-bar', 'topbar:view'],
  ['/admin/settings',  'settings:view'],
  ['/admin/users',     null],   // null = superadmin only (no standalone permission key)
];

/**
 * Gate every /admin/* route behind a valid admin session.
 *
 * Exceptions (no session required):
 *   - /admin/login               the login screen itself
 *   - /admin/forgot-password     password reset flow
 *   - /admin/unauthorized        the "access denied" landing page
 *
 * Permission enforcement:
 *   After session is confirmed, non-superadmin users are further checked
 *   against ROUTE_PERMISSIONS. Accessing a route without the required
 *   permission redirects to /admin/unauthorized.
 */
export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  const PUBLIC_ADMIN = ['/admin/login', '/admin/forgot-password', '/admin/unauthorized'];
  if (PUBLIC_ADMIN.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Build the downstream response up front so iron-session has a place to
  // attach any Set-Cookie updates (e.g. rolling sessions).
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session.isAdmin) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.search = '';
    return NextResponse.redirect(loginUrl);
  }

  // Superadmin bypasses all route-level permission checks.
  if (session.role === 'SUPER_ADMIN') {
    return res;
  }

  // For team members, find the required permission for this route.
  const match = ROUTE_PERMISSIONS.find(([prefix]) => pathname.startsWith(prefix));
  if (match) {
    const [, requiredPermission] = match;
    // null means superadmin-only — already redirected above for non-superadmin.
    if (
      requiredPermission === null ||
      !(session.permissions ?? []).includes(requiredPermission)
    ) {
      const unauthorizedUrl = req.nextUrl.clone();
      unauthorizedUrl.pathname = '/admin/unauthorized';
      unauthorizedUrl.search = '';
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  return res;
}

export const config = {
  /**
   * Run on every /admin/* path. Static assets served by Next under
   * /_next/* are excluded automatically by the App Router.
   */
  matcher: ['/admin/:path*'],
};

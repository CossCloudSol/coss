import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { ALL_PERMISSIONS, type Permission } from '@/lib/permissions';

/**
 * Maps an admin route prefix to the permission key that grants access.
 * First match wins (entries are checked in order), so a prefix that another
 * entry starts with must come after it (whatsapp-clicks before whatsapp).
 * Routes NOT listed here are accessible to any authenticated admin.
 * null = superadmin only, for the page and all of its /api/admin routes.
 * Keep the admin Sidebar's permissionKey / superAdminOnly in step with this.
 */
const ROUTE_PERMISSIONS: ReadonlyArray<readonly [string, Permission | null]> = [
  ['/admin/leads',            'leads:view'],
  ['/admin/corporate',        'corporate:view'],
  ['/admin/whatsapp-clicks',  'whatsappclicks:view'],
  ['/admin/whatsapp',         'whatsapp:view'],
  ['/admin/call-clicks',      'callclicks:view'],
  ['/admin/seo',              'seo:view'],
  ['/admin/geo',              'seo:view'],
  ['/admin/analytics',        'analytics:view'],
  ['/admin/topbar',           'topbar:view'],
  ['/admin/announcement-bar', 'topbar:view'],
  ['/admin/settings',         'settings:view'],

  ['/admin/courses',          'content:view'],
  ['/admin/categories',       'content:view'],
  ['/admin/blog',             'content:view'],
  ['/admin/jobs',             'content:view'],
  ['/admin/trainers',         'content:view'],
  ['/admin/testimonials',     'content:view'],
  ['/admin/hiring-partners',  'content:view'],
  ['/admin/social-posts',     'content:view'],
  ['/admin/homepage',         'content:view'],
  ['/admin/content-blocks',   'content:view'],
  ['/admin/media',            'content:view'],
  ['/admin/generate',         'content:view'],   // API only (/api/admin/generate/*)

  ['/admin/users',            null],
  ['/admin/redirects',        null],
  ['/admin/batches',          null],
  ['/admin/schema',           null],
  ['/admin/sitemap',          null],
  ['/admin/revalidate',       null],   // API only (/api/admin/revalidate)
];

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * /api/admin/* write routes any signed-in admin may call: they act on the
 * caller's own notifications, notification preferences and push devices.
 */
const SELF_SERVICE_API = [
  '/api/admin/notifications',
  '/api/admin/notification-preferences',
  '/api/admin/push',
];

/**
 * Permission required to write to an /api/admin/* route, derived from
 * ROUTE_PERMISSIONS: /api/admin/<area> maps onto the /admin/<area> page, whose
 * '<area>:view' key becomes '<area>:delete' for DELETE (when that key exists)
 * or '<area>:edit' otherwise. Returns null (superadmin only) when the area has
 * no entry or no matching key, so new routes are closed by default.
 */
function apiWritePermission(pathname: string, method: string): string | null {
  const adminPath = pathname.slice('/api'.length);
  const match = ROUTE_PERMISSIONS.find(([prefix]) => adminPath.startsWith(prefix));
  if (!match || match[1] === null) return null;
  const area = match[1].split(':')[0];
  const candidates = method === 'DELETE' ? [`${area}:delete`, `${area}:edit`] : [`${area}:edit`];
  return candidates.find((key) => (ALL_PERMISSIONS as string[]).includes(key)) ?? null;
}

/**
 * Role/permission gate for /api/admin/*. Writes need the area's edit/delete
 * key; reads of a superadmin-only (null) area need SUPER_ADMIN; other reads
 * are left to each handler's own session check. /api/admin/auth (login and
 * logout) needs no session.
 */
async function guardAdminApi(req: NextRequest, pathname: string): Promise<NextResponse> {
  if (pathname === '/api/admin/auth') {
    return NextResponse.next();
  }
  const isWrite = WRITE_METHODS.has(req.method);
  const adminPath = pathname.slice('/api'.length);
  const superAdminOnly = ROUTE_PERMISSIONS.find(([prefix]) => adminPath.startsWith(prefix))?.[1] === null;
  if (!isWrite && !superAdminOnly) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const session = await getSession(req, res);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role === 'SUPER_ADMIN') {
    return res;
  }
  if (!isWrite) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (SELF_SERVICE_API.some((p) => pathname.startsWith(p))) {
    return res;
  }

  const required = apiWritePermission(pathname, req.method);
  if (required && (session.permissions ?? []).includes(required)) {
    return res;
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

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
 *
 * /api/admin/* writes are checked by guardAdminApi (JSON 401/403, no redirect).
 */
export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/admin')) {
    return guardAdminApi(req, pathname);
  }

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
   * Run on every /admin/* page and /api/admin/* route. Static assets served
   * by Next under /_next/* are excluded automatically by the App Router.
   */
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

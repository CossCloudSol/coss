import type { AdminRole, Permission } from '@/lib/permissions';

/**
 * Who may open an admin page or call an admin API route: one table and one
 * function, used by the middleware (first layer, Edge), by every
 * /api/admin/* handler through requireAdmin() (second layer, with a fresh
 * database check of the user), by the admin layout, and by the sidebar and
 * mobile bottom nav (so a menu never shows what the route would refuse).
 * Dependency-free: safe in the Edge middleware and in client components.
 */

/**
 * Admin route prefix → permission that opens it. First match wins, so a prefix
 * that another entry starts with must come after it (whatsapp-clicks before
 * whatsapp). null = super admin only, for the page and every matching
 * /api/admin route. /api/admin/<area> maps onto /admin/<area>.
 */
export const ROUTE_PERMISSIONS: ReadonlyArray<readonly [string, Permission | null]> = [
  ['/admin/notifications/test', null],   // sends a push/email to every subscriber
  ['/admin/leads',            'leads:view'],
  ['/admin/corporate',        'corporate:view'],
  ['/admin/whatsapp-clicks',  'whatsappclicks:view'],
  ['/admin/whatsapp',         'whatsapp:view'],
  ['/admin/call-clicks',      'callclicks:view'],
  ['/admin/seo',              'seo:view'],
  ['/admin/analytics',        'analytics:view'],
  ['/admin/stats',            'dashboard:view'],
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
  ['/admin/promo-banners',    'content:edit'],   // the page needs edit rights, not just view
  ['/admin/generate',         'content:view'],   // API only (/api/admin/generate/*)

  ['/admin/users',            null],
  // The GEO manager edits the branch records (addresses, phone numbers, email)
  // shown sitewide; every /api/admin/geo/* route writes BranchSettings.
  ['/admin/geo',              null],
  ['/admin/redirects',        null],
  ['/admin/batches',          null],
  ['/admin/schema',           null],
  ['/admin/sitemap',          null],
  ['/admin/revalidate',       null],   // API only (/api/admin/revalidate)
];

/** The caller's own notifications, notification preferences and push devices. */
const SELF_SERVICE = ['/admin/notifications', '/admin/notification-preferences', '/admin/push'];

/** No session needed: the login and logout endpoints and the screens around login. */
const PUBLIC_API = ['/api/admin/auth', '/api/admin/auth/logout'];
const PUBLIC_PAGES = ['/admin/login', '/admin/forgot-password', '/admin/unauthorized'];

/** Request header (set by the middleware) that tells the admin layout which page it renders. */
export const ADMIN_PATH_HEADER = 'x-admin-pathname';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * The :edit and :delete keys that exist (src/lib/permissions.ts). Kept here so this
 * module has no runtime imports; scripts/test/admin-access.test.mjs fails if it drifts.
 */
export const WRITE_KEYS: ReadonlySet<string> = new Set([
  'leads:edit', 'leads:delete',
  'corporate:edit', 'corporate:delete',
  'content:edit', 'content:delete',
  'seo:edit',
  'topbar:edit',
  'settings:edit',
]);

export type Access =
  | { kind: 'public' }
  | { kind: 'signed-in' }
  | { kind: 'super' }
  | { kind: 'permission'; key: Permission };

/**
 * What a request needs. Pages: the area's configured key. API reads: the
 * area's ':view'. API writes: ':delete' for DELETE, ':edit' otherwise; an area
 * without that key, an unlisted area, and every null area are super admin
 * only, so new routes are closed by default. The caller's own notifications
 * are open to any signed-in admin, except the test send.
 */
export function requiredAccess(pathname: string, method = 'GET'): Access {
  const isApi = pathname.startsWith('/api/admin');
  if (isApi ? PUBLIC_API.includes(pathname) : PUBLIC_PAGES.some((p) => pathname.startsWith(p))) return { kind: 'public' };
  const adminPath = isApi ? pathname.slice('/api'.length) : pathname;
  const isWrite = isApi && WRITE_METHODS.has(method.toUpperCase());
  const match = ROUTE_PERMISSIONS.find(([prefix]) => adminPath.startsWith(prefix));
  const pageKey = match ? match[1] : undefined;
  if (pageKey === null) return { kind: 'super' };
  if (SELF_SERVICE.some((p) => adminPath.startsWith(p))) return { kind: 'signed-in' };
  if (pageKey === undefined) return isWrite ? { kind: 'super' } : { kind: 'signed-in' };
  if (!isApi) return { kind: 'permission', key: pageKey };
  const area = pageKey.split(':')[0];
  if (!isWrite) return { kind: 'permission', key: `${area}:view` as Permission };
  const key = `${area}:${method.toUpperCase() === 'DELETE' ? 'delete' : 'edit'}`;
  return WRITE_KEYS.has(key) ? { kind: 'permission', key: key as Permission } : { kind: 'super' };
}

/** Whether a user with this role and these permissions passes. */
export function isAllowed(access: Access, user: { role?: AdminRole | null; permissions?: readonly string[] | null } | null): boolean {
  if (access.kind === 'public') return true;
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  if (access.kind === 'signed-in') return true;
  if (access.kind === 'super') return false;
  return (user.permissions ?? []).includes(access.key);
}

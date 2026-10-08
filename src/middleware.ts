import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { requiredAccess, isAllowed, ADMIN_PATH_HEADER } from '@/lib/admin-access';
import { COURSE_FILTER_PARAMS } from '@/lib/course-search';

/**
 * First layer for /admin/* pages and /api/admin/* routes, from the session
 * cookie (Edge: no database here). The table and the rules live in
 * src/lib/admin-access.ts. The second layer, requireAdmin() in every
 * /api/admin handler and the admin layout, re-reads the user from the database.
 *   - /api/admin/*: JSON 401 (not signed in) or 403 (not allowed).
 *   - /admin/*: redirect to /admin/login or /admin/unauthorized.
 */
export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // /courses filtered views (?q=, ?cat=, …) are the same static page filtered
  // on the client: keep them out of the index but let crawlers follow links.
  // /blog?tag=… shows the same post list as /blog (the tag isn't a page of its own):
  // keep those URLs out of the index, but let crawlers follow the post links.
  if (pathname === '/blog') {
    const res = NextResponse.next();
    if (req.nextUrl.searchParams.has('tag')) res.headers.set('X-Robots-Tag', 'noindex, follow');
    return res;
  }

  if (pathname === '/courses') {
    const res = NextResponse.next();
    if (COURSE_FILTER_PARAMS.some((p) => req.nextUrl.searchParams.has(p))) {
      res.headers.set('X-Robots-Tag', 'noindex, follow');
    }
    return res;
  }

  const isApi = pathname.startsWith('/api/admin');
  const headers = new Headers(req.headers);
  headers.set(ADMIN_PATH_HEADER, pathname);
  const access = requiredAccess(pathname, req.method);
  if (access.kind === 'public') return NextResponse.next({ request: { headers } });

  // The downstream response is built up front so iron-session has a place to
  // attach any Set-Cookie updates.
  const res = NextResponse.next({ request: { headers } });
  const session = await getSession(req, res);

  if (!session.isAdmin) {
    if (isApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.search = '';
    return NextResponse.redirect(loginUrl);
  }

  if (isAllowed(access, session)) return res;
  if (isApi) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const unauthorizedUrl = req.nextUrl.clone();
  unauthorizedUrl.pathname = '/admin/unauthorized';
  unauthorizedUrl.search = '';
  return NextResponse.redirect(unauthorizedUrl);
}

export const config = {
  /**
   * Run on every /admin/* page and /api/admin/* route, plus /courses and /blog
   * (noindex header on filtered and tag views). Static assets served by Next under /_next/*
   * are excluded automatically by the App Router.
   */
  matcher: ['/admin/:path*', '/api/admin/:path*', '/courses', '/blog'],
};

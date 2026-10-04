import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/auth/logout: ends the session and returns to the login page
 * (303, so the browser follows with a GET). POST only, from the sidebar's form:
 * the session cookie is SameSite=Lax, so another site can't post it here.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const res = NextResponse.redirect(new URL('/admin/login', req.url), 303);
  const session = await getSession(req, res);
  session.destroy();
  return res;
}

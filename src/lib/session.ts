import { getIronSession, type SessionOptions } from 'iron-session';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Shape of the data stored inside the encrypted admin cookie.
 * Keep this intentionally tiny — anything sensitive belongs in the DB keyed by
 * a server-side identifier, not in the cookie.
 */
export interface SessionData {
  isAdmin: boolean;
  /** Set for DB-backed users. Absent for the env-var superadmin. */
  userId?: string;
  name?: string;
  email?: string;
  role?: 'SUPER_ADMIN' | 'ADMISSIONS_SALES' | 'SUPPORT_HELPDESK';
  permissions?: string[];
}

export const SESSION_COOKIE_NAME = 'coss_admin_session';

/**
 * Session options are consumed by iron-session. We read the secret from env at
 * every call (rather than throwing at module load) so that `next build` still
 * succeeds in environments where the secret isn't present yet.
 */
export const sessionOptions: SessionOptions = {
  cookieName: SESSION_COOKIE_NAME,
  password: process.env.ADMIN_SESSION_SECRET ?? '',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  },
};

/**
 * Narrow runtime check that fires as soon as we try to read or write a session.
 * Keeps the error close to the call site instead of exploding deep inside
 * iron-session with a cryptic "password must be a string of at least 32 chars"
 * from the crypto layer.
 */
function assertSessionSecret(): void {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'ADMIN_SESSION_SECRET is missing or shorter than 32 characters. ' +
        'Set it in .env.local (e.g. generate with `openssl rand -base64 48`).',
    );
  }
}

/**
 * Server-component helper — reads the session from the Next.js cookie store.
 * Use this inside `async` Server Components, Server Actions, and Route Segment
 * configs where there is no explicit Request/Response to pass.
 */
export async function getServerSession(): Promise<
  SessionData & {
    save: () => Promise<void>;
    destroy: () => void;
    updateConfig: (options: SessionOptions) => void;
  }
> {
  assertSessionSecret();
  const { cookies } = await (import('next/headers') as Promise<typeof import('next/headers')>);
  const cookieStore = await cookies();
  // iron-session v8 accepts a ReadonlyRequestCookies from next/headers
  return getIronSession<SessionData>(cookieStore as any, sessionOptions);
}

/**
 * Primary helper — works in middleware and in route handlers.
 *
 * In a route handler, pass the incoming request and a response you intend to
 * return (iron-session writes Set-Cookie headers onto that response):
 *
 *   const res = NextResponse.json({ ok: true });
 *   const session = await getSession(req, res);
 *   session.isAdmin = true;
 *   await session.save();
 *   return res;
 *
 * In middleware, pass `req` and a `NextResponse.next()` you plan to return.
 */
export async function getSession(
  req: NextRequest,
  res: NextResponse,
): Promise<
  SessionData & {
    save: () => Promise<void>;
    destroy: () => void;
    updateConfig: (options: SessionOptions) => void;
  }
> {
  assertSessionSecret();
  return getIronSession<SessionData>(req, res, sessionOptions);
}

/**
 * Route handler signature used by Next.js App Router.
 * Generic over the params map so individual handlers can keep their own shape.
 */
type RouteContext<TParams extends Record<string, string | string[]> = Record<string, string | string[]>> = {
  params: TParams;
};

type RouteHandler<
  TParams extends Record<string, string | string[]> = Record<string, string | string[]>,
> = (req: NextRequest, ctx: RouteContext<TParams>) => Promise<Response> | Response;

/**
 * Wrap a route handler so it only runs for authenticated admins.
 * Returns 401 JSON when the caller isn't signed in.
 *
 * Usage:
 *   export const GET = withAdminAuth(async (req) => {
 *     return NextResponse.json({ secret: 'stuff' });
 *   });
 */
export function withAdminAuth<
  TParams extends Record<string, string | string[]> = Record<string, string | string[]>,
>(handler: RouteHandler<TParams>): RouteHandler<TParams> {
  return async (req, ctx) => {
    // We only need the session for reading here — create a throwaway response
    // so iron-session has somewhere to attach cookies if it needed to refresh.
    const probe = NextResponse.next();
    const session = await getSession(req, probe);
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req, ctx);
  };
}

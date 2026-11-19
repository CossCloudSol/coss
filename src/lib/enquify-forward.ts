/**
 * Optional copy of each new enquiry to an external lead hub (Enquify website
 * intake). The enquiry is always saved here first; this copy is extra and can
 * never fail or slow down the form response.
 *
 * Off unless ENQUIFY_FORWARD=1. Address and secret come only from env vars:
 *   ENQUIFY_INTAKE_URL     full https URL of the intake endpoint
 *   ENQUIFY_INTAKE_SECRET  signing secret, 32+ characters
 *
 * Each post is JSON, signed with
 *   x-enquify-timestamp: <unix seconds>
 *   x-enquify-signature: sha256=<hex HMAC-SHA256 of "<timestamp>.<raw body>">
 * and carries this site's own lead id, so a retry is kept only once on the
 * other side. Outside the production deployment posts are marked as tests.
 *
 * Dependency-free (unit-tested in scripts/test/enquify-forward.test.mjs).
 */
import { createHmac } from 'node:crypto';

export const MIN_SECRET = 32;
const TIMEOUT_MS = 5_000;
const ATTEMPTS = 2;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com').replace(/\/+$/, '');

type Env = Record<string, string | undefined>;

export interface ForwardConfig {
  url: string;
  secret: string;
  test: boolean;
}

/** The forwarding settings, or null when forwarding is off or not fully set. */
export function forwardConfig(env: Env = process.env): ForwardConfig | null {
  if (env.ENQUIFY_FORWARD !== '1') return null;
  const url = (env.ENQUIFY_INTAKE_URL ?? '').trim();
  const secret = env.ENQUIFY_INTAKE_SECRET ?? '';
  if (secret.length < MIN_SECRET) return null;
  try {
    if (new URL(url).protocol !== 'https:') return null;
  } catch {
    return null;
  }
  return { url, secret, test: env.VERCEL_ENV !== 'production' };
}

export interface ForwardLead {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  course?: string | null;
  branch?: string | null;
  message?: string | null;
  landingPage?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
}

/** The page the form sat on, as a full URL with its first-touch tags, else null. */
export function pageUrl(l: ForwardLead, siteUrl: string = SITE_URL): string | null {
  const path = (l.landingPage ?? '').trim();
  if (!path) return null;
  let u: URL;
  try {
    u = new URL(path, `${siteUrl}/`);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const tags: [string, string | null | undefined][] = [
    ['utm_source', l.utmSource], ['utm_medium', l.utmMedium], ['utm_campaign', l.utmCampaign],
    ['utm_term', l.utmTerm], ['utm_content', l.utmContent], ['gclid', l.gclid], ['fbclid', l.fbclid],
  ];
  for (const [k, v] of tags) if (v && !u.searchParams.has(k)) u.searchParams.set(k, v);
  return u.toString();
}

/** The JSON body sent for one lead. */
export function forwardBody(l: ForwardLead, test: boolean, siteUrl: string = SITE_URL): string {
  return JSON.stringify({
    id: l.id,
    name: l.name,
    phone: l.phone,
    email: l.email ?? null,
    course: l.course ?? null,
    branch: l.branch ?? null,
    message: l.message ?? null,
    page: pageUrl(l, siteUrl),
    referrer: l.referrer ?? null,
    test,
  });
}

export function signature(secret: string, timestamp: string, raw: string): string {
  return `sha256=${createHmac('sha256', secret).update(`${timestamp}.${raw}`, 'utf8').digest('hex')}`;
}

export type ForwardResult = { sent: true; status: number } | { sent: false; reason: string };

/**
 * Posts one lead. Never throws. Retries once on a network error, a timeout or
 * a 5xx/429 answer (safe: the other side keeps each id once).
 */
export async function forwardLead(
  lead: ForwardLead,
  env: Env = process.env,
  fetchImpl: typeof fetch = globalThis.fetch,
  now: () => number = Date.now,
): Promise<ForwardResult> {
  const cfg = forwardConfig(env);
  if (!cfg) return { sent: false, reason: 'off' };
  const raw = forwardBody(lead, cfg.test);
  let last = 'unknown';
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const ts = String(Math.floor(now() / 1000));
    try {
      const res = await fetchImpl(cfg.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-enquify-timestamp': ts,
          'x-enquify-signature': signature(cfg.secret, ts, raw),
        },
        body: raw,
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: 'no-store',
      });
      if (res.ok) return { sent: true, status: res.status };
      last = `status ${res.status}`;
      if (res.status < 500 && res.status !== 429) break;
    } catch (err) {
      last = err instanceof Error ? err.name : 'error';
    }
  }
  return { sent: false, reason: last };
}

/** Fire-and-forget wrapper for the lead routes: logs, never throws. */
export async function forwardLeadSafely(lead: ForwardLead): Promise<void> {
  try {
    const r = await forwardLead(lead);
    if (!r.sent && r.reason !== 'off') console.error(`[enquify-forward] lead ${lead.id} not forwarded (${r.reason})`);
  } catch (err) {
    console.error(`[enquify-forward] lead ${lead.id} not forwarded`, err instanceof Error ? err.message : err);
  }
}

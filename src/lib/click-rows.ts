import { PRODUCTION_HOST } from '@/lib/production-host';

/** The host a request was made to: x-forwarded-host (set by Vercel), else host; lowercase, no port. */
export function requestHost(headers: Headers): string {
  const raw = headers.get('x-forwarded-host') ?? headers.get('host') ?? '';
  return (raw.split(',')[0] ?? '').trim().toLowerCase().replace(/:\d+$/, '');
}

/**
 * Click-logging endpoints (/api/cta-clicks, /api/call-clicks, /api/whatsapp-clicks) save rows
 * only for requests to the production host. Vercel previews have written to the production
 * database, so a check by deployment type is not enough; on any other host (previews,
 * localhost) the endpoints still validate the body but answer 204 and save nothing. GA4
 * events fire from the browser either way.
 */
export function savesClickRows(headers: Headers): boolean {
  return requestHost(headers) === PRODUCTION_HOST;
}

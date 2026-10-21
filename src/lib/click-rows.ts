/**
 * Click-logging endpoints (/api/cta-clicks, /api/call-clicks, /api/whatsapp-clicks) write rows
 * only on Vercel deployments: production, and previews (which have their own database, so
 * /admin/tracking can be checked there). Local and development runs have no VERCEL_ENV (or
 * 'development') and write nothing; the endpoints still validate the body and answer 204.
 * GA4 events fire from the browser either way.
 */
export function savesClickRows(env: string | undefined = process.env.VERCEL_ENV): boolean {
  return env === 'production' || env === 'preview';
}

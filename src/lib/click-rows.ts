/**
 * Click-logging endpoints (/api/cta-clicks, /api/call-clicks, /api/whatsapp-clicks) write rows
 * only on the production deployment. Vercel previews read and write the production database,
 * so a preview check would otherwise add test clicks to the admin tracking report; local dev
 * has no VERCEL_ENV and writes nothing either. Outside production the endpoints still validate
 * the body and answer 204. GA4 events fire from the browser either way.
 */
export function savesClickRows(env: string | undefined = process.env.VERCEL_ENV): boolean {
  return env === 'production';
}

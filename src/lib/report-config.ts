/** Who gets the Monday weekly tracking email (the address lives here, not in the route). */
export const WEEKLY_REPORT_RECIPIENTS: readonly string[] = ['cossdsnrcoss@gmail.com']

/** Vercel cron for /api/cron/weekly-report: Monday 09:00 IST = 03:30 UTC (kept in step with vercel.json by a test). */
export const WEEKLY_REPORT_CRON = '30 3 * * 1'

/** Where the email's "open the report" link points. */
export const WEEKLY_REPORT_SITE = 'https://www.cosscloudsol.com'
export const WEEKLY_REPORT_PATH = '/admin/tracking/weekly'

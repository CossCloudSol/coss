import { NextResponse, type NextRequest } from 'next/server'
import { isAuthorizedCron } from '@/lib/cron-auth'
import { sendEmail } from '@/lib/email'
import { loadWeeklyReport } from '@/lib/weekly-report-data'
import { weeklyEmailHtml, weeklySubject } from '@/lib/weekly-report'
import { WEEKLY_REPORT_RECIPIENTS } from '@/lib/report-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Scheduled: 30 3 * * 1 (Monday 03:30 UTC = 09:00 IST). Auth: CRON_SECRET, like the other crons.
// ?preview=1 (still CRON_SECRET) returns the HTML of last week's email and sends nothing.
export async function GET(req: NextRequest): Promise<Response> {
  if (!isAuthorizedCron(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const report = await loadWeeklyReport()
    const html = weeklyEmailHtml(report)
    if (req.nextUrl.searchParams.get('preview') === '1') {
      return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
    }
    const subject = weeklySubject(report)
    let sent = 0
    for (const to of WEEKLY_REPORT_RECIPIENTS) {
      await sendEmail({ to, subject, html })
      sent += 1
    }
    return NextResponse.json({ ok: true, sent, week: report.current.from })
  } catch (err) {
    console.error('[cron weekly-report] failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Weekly report failed' }, { status: 500 })
  }
}

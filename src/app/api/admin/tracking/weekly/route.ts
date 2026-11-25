import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { loadWeeklyReport } from '@/lib/weekly-report-data'
import { weeklyCsv, weeklyEmailHtml } from '@/lib/weekly-report'
import { withCsvBom } from '@/lib/csv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// /admin/tracking/weekly as CSV. /api/admin/tracking/* needs analytics:view (lib/admin-access).
export async function GET(req: NextRequest): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard
  try {
    const report = await loadWeeklyReport()
    // ?format=email: the Monday email for last week as HTML (nothing is sent).
    if (req.nextUrl.searchParams.get('format') === 'email') {
      return new NextResponse(weeklyEmailHtml(report), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
    }
    return new NextResponse(withCsvBom(weeklyCsv(report)), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="coss-weekly-${report.current.from}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[GET /api/admin/tracking/weekly] DB error:', err)
    return NextResponse.json({ error: 'Failed to load the weekly report' }, { status: 500 })
  }
}

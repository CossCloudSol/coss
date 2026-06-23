import { NextRequest, NextResponse } from 'next/server'
import { runImageScan } from '@/lib/media-scanner'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runImageScan()
    return NextResponse.json({ ok: true, scannedAt: result.scannedAt, broken: result.brokenCount })
  } catch (err) {
    console.error('Media scan cron failed:', err)
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}

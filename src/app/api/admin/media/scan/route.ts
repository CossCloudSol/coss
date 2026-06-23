import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { runImageScan, runQuickScan } from '@/lib/media-scanner'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // seconds — Vercel Hobby plan max

export async function GET(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const latest = await prisma.mediaScanResult.findFirst({
    orderBy: { scannedAt: 'desc' },
  })

  return NextResponse.json(latest ?? null)
}

export async function POST(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runQuickScan()
    return NextResponse.json(result)
  } catch (err) {
    console.error('[media/scan POST]', err)
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}

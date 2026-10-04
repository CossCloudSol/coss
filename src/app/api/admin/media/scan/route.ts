import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { runImageScan, runQuickScan } from '@/lib/media-scanner'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // seconds — Vercel Hobby plan max

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const latest = await prisma.mediaScanResult.findFirst({
    orderBy: { scannedAt: 'desc' },
  })

  return NextResponse.json(latest ?? null)
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  try {
    const result = await runQuickScan()
    return NextResponse.json(result)
  } catch (err) {
    console.error('[media/scan POST]', err)
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}

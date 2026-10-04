import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const partners = await prisma.hiringPartner.findMany({
    select: { id: true, name: true, logoUrl: true },
  })

  const results = await Promise.all(
    partners.map(async (p) => {
      if (!p.logoUrl) return { id: p.id, name: p.name, logoUrl: p.logoUrl, status: 0, ok: false }
      try {
        const res = await fetch(p.logoUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        })
        return { id: p.id, name: p.name, logoUrl: p.logoUrl, status: res.status, ok: res.ok }
      } catch {
        return { id: p.id, name: p.name, logoUrl: p.logoUrl, status: 0, ok: false }
      }
    })
  )

  return NextResponse.json(results)
}

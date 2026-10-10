import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { revalidatePaths, getHiringPartnerRevalidationPaths } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const { ids } = await req.json()
  if (!Array.isArray(ids)) return NextResponse.json({ error: 'ids must be array' }, { status: 400 })

  await Promise.all(
    ids.map((id: string, index: number) =>
      prisma.hiringPartner.update({
        where: { id },
        data: { sortOrder: index + 1 },
      })
    )
  )
  await revalidatePaths(getHiringPartnerRevalidationPaths())
  return NextResponse.json({ ok: true })
}

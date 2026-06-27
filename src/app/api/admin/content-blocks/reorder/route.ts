import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids } = await req.json()
  if (!Array.isArray(ids)) return NextResponse.json({ error: 'ids must be array' }, { status: 400 })

  await Promise.all(
    ids.map((id: string, index: number) =>
      (prisma as any).contentBlock.update({
        where: { id },
        data: { sortOrder: index + 1 },
      })
    )
  )
  return NextResponse.json({ ok: true })
}

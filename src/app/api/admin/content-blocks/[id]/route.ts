import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const block = await (prisma as any).contentBlock.update({
    where: { id: params.id },
    data: body,
  })
  return NextResponse.json(block)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await (prisma as any).contentBlock.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

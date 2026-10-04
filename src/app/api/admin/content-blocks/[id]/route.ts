import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

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
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  await (prisma as any).contentBlock.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

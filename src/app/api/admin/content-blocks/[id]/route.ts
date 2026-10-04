import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { pickFields, CONTENT_BLOCK_FIELDS } from '@/lib/pick-fields'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const picked = pickFields(await req.json().catch(() => null), CONTENT_BLOCK_FIELDS)
  if ('error' in picked) return NextResponse.json({ error: picked.error }, { status: 400 })
  const block = await (prisma as any).contentBlock.update({
    where: { id: params.id },
    data: picked.data,
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

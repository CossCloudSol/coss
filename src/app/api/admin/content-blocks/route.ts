import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { pickFields, CONTENT_BLOCK_FIELDS } from '@/lib/pick-fields'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const { searchParams } = req.nextUrl
  const page      = searchParams.get('page')
  const blockType = searchParams.get('blockType')

  const where: Record<string, unknown> = {}
  if (page)      where.page = page
  if (blockType) where.blockType = blockType

  const blocks = await (prisma as any).contentBlock.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json(blocks)
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const picked = pickFields(await req.json().catch(() => null), CONTENT_BLOCK_FIELDS)
  if ('error' in picked) return NextResponse.json({ error: picked.error }, { status: 400 })
  const block = await (prisma as any).contentBlock.create({ data: picked.data })
  return NextResponse.json(block)
}

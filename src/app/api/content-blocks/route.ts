import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page      = searchParams.get('page') ?? 'global'
  const blockType = searchParams.get('blockType')

  const where: Record<string, unknown> = { isVisible: true, page }
  if (blockType) where.blockType = blockType

  const blocks = await (prisma as any).contentBlock.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true, blockType: true, title: true, body: true,
      icon: true, metadata: true, gridStyle: true, sortOrder: true,
    },
  })

  return NextResponse.json(blocks)
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const categories = await prisma.courseCategory.findMany({
    where: { status: 'published' },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: {
          courses: { where: { status: 'published' } },
        },
      },
    },
  })
  return NextResponse.json({ categories })
}

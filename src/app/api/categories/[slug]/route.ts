import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: { slug: string } }

export async function GET(_req: NextRequest, { params }: RouteContext): Promise<Response> {
  const category = await prisma.courseCategory.findUnique({
    where: { slug: params.slug },
    include: {
      courses: {
        where: { status: 'published' },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!category) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ category })
}

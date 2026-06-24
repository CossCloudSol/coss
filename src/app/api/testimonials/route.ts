import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const scope      = searchParams.get('scope') ?? 'global'
  const courseSlug = searchParams.get('courseSlug')
  const limit      = parseInt(searchParams.get('limit') ?? '10')

  const where: Record<string, unknown> = { visible: true }
  if (scope === 'course' && courseSlug) {
    where.courseSlug = courseSlug
  } else {
    where.scope = 'global'
  }

  const items = await prisma.testimonial.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    take: limit,
    select: {
      id: true, name: true, jobTitle: true, company: true,
      quote: true, rating: true, photoUrl: true,
      scope: true, courseSlug: true, reviewDate: true,
    },
  })

  return NextResponse.json(items)
}

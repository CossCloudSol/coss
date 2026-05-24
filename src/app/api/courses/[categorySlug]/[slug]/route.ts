import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: { categorySlug: string; slug: string } }

export async function GET(_req: NextRequest, { params }: RouteContext): Promise<Response> {
  const course = await prisma.course.findFirst({
    where: {
      slug: params.slug,
      categorySlug: params.categorySlug,
      status: 'published',
    },
  })

  if (!course) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(course)
}

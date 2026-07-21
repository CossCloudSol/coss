import { NextResponse, type NextRequest } from 'next/server'
import { getCategoryBySlugWithCourses } from '@/lib/course-queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: { slug: string } }

export async function GET(_req: NextRequest, { params }: RouteContext): Promise<Response> {
  const category = await getCategoryBySlugWithCourses(params.slug)

  if (!category) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ category })
}

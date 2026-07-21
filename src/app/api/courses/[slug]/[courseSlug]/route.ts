import { NextResponse, type NextRequest } from 'next/server'
import { getCourseInCategory } from '@/lib/course-queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: { slug: string; courseSlug: string } }

export async function GET(_req: NextRequest, { params }: RouteContext): Promise<Response> {
  const course = await getCourseInCategory(params.slug, params.courseSlug)

  if (!course) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(course)
}

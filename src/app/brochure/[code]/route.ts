import { prisma } from '@/lib/db'
import { attachmentUrl } from '@/lib/cloudinary'
import { refCourseByCode, refCourseFor } from '@/lib/wa-ref'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// /brochure/<REF COURSE CODE> (case-insensitive, e.g. awsdevops): 302 to that course's brochure PDF,
// 404 when the code is unknown or the course has no brochure. Not indexed, not in the sitemap;
// the code map is the one WhatsApp ref codes use (lib/wa-ref).
const HEADERS = { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' }

export async function GET(_req: Request, { params }: { params: { code: string } }): Promise<Response> {
  const entry = refCourseByCode(decodeURIComponent(params.code))
  if (!entry) return new Response('Not found', { status: 404, headers: { ...HEADERS, 'Content-Type': 'text/plain; charset=utf-8' } })

  const courses = await prisma.course.findMany({
    where: { status: 'published', brochureUrl: { not: null } },
    select: { slug: true, title: true, brochureUrl: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  const course = courses.find((c) => c.brochureUrl?.trim() && refCourseFor(c.slug, c.title)?.code === entry.code)
  if (!course?.brochureUrl) return new Response('Not found', { status: 404, headers: { ...HEADERS, 'Content-Type': 'text/plain; charset=utf-8' } })

  return new Response(null, { status: 302, headers: { ...HEADERS, Location: attachmentUrl(course.brochureUrl) } })
}

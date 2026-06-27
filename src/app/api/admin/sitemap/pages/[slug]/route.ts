import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
): Promise<Response> {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = decodeURIComponent(params.slug)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { sitemapInclude, sitemapPriority, changeFreq } = body

  const existing = await prisma.pageSeo.findFirst({
    where: {
      OR: [
        { pageSlug: slug },
        { pageSlug: `/${slug}` },
        { pageSlug: slug.replace(/^\//, '') },
        // home page: slug '' maps to '/'
        ...(slug === '' ? [{ pageSlug: '/' }] : []),
      ],
    },
  })

  if (existing) {
    const updated = await prisma.pageSeo.update({
      where: { id: existing.id },
      data: {
        ...(sitemapInclude  !== undefined && { sitemapInclude:  Boolean(sitemapInclude) }),
        ...(sitemapPriority !== undefined && { sitemapPriority: Number(sitemapPriority) }),
        ...(changeFreq      !== undefined && { changeFreq:      String(changeFreq) }),
      },
    })
    return NextResponse.json(updated)
  }

  // Upsert — create PageSeo row if none exists yet
  const created = await prisma.pageSeo.create({
    data: {
      pageSlug:        slug === '' ? '/' : slug,
      pageTitle:       slug === '' ? '/ (Homepage)' : slug,
      sitemapInclude:  sitemapInclude  !== undefined ? Boolean(sitemapInclude)  : true,
      sitemapPriority: sitemapPriority !== undefined ? Number(sitemapPriority)  : 0.7,
      changeFreq:      changeFreq      !== undefined ? String(changeFreq)       : 'monthly',
    },
  })
  return NextResponse.json(created)
}

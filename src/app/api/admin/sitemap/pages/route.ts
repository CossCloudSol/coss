import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { COURSE_PAGES, CATEGORY_PAGES, STATIC_PAGES } from '@/lib/all-pages-registry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbRows = await prisma.pageSeo.findMany({
    select: {
      id: true,
      pageSlug: true,
      pageTitle: true,
      sitemapInclude: true,
      sitemapPriority: true,
      changeFreq: true,
    },
  })

  const dbMap = new Map(dbRows.map(r => [r.pageSlug, r]))

  function findDb(slug: string) {
    const normalized = slug === '' ? '/' : slug
    return (
      dbMap.get(slug) ??
      dbMap.get(normalized) ??
      dbMap.get(`/${slug}`) ??
      dbMap.get(slug.replace(/^\//, ''))
    )
  }

  const allPages = [
    ...STATIC_PAGES.map(p => ({
      slug: p.slug,
      name: p.slug === '' ? '/ (Homepage)' : `/${p.slug}`,
      group: 'static' as const,
      defaultPriority: p.priority,
      defaultFreq: p.changeFrequency,
    })),
    ...COURSE_PAGES.map(p => ({
      slug: p.slug,
      name: `/${p.slug}`,
      group: 'landing' as const,
      defaultPriority: p.priority ?? 0.85,
      defaultFreq: 'monthly',
    })),
    ...CATEGORY_PAGES.map(p => ({
      slug: p.slug,
      name: `/${p.slug}`,
      group: 'category' as const,
      defaultPriority: p.priority ?? 0.85,
      defaultFreq: 'monthly',
    })),
  ].map(page => {
    const db = findDb(page.slug)
    return {
      slug:            page.slug,
      name:            page.name,
      group:           page.group,
      dbId:            db?.id ?? null,
      sitemapInclude:  db?.sitemapInclude  ?? true,
      sitemapPriority: db?.sitemapPriority ?? page.defaultPriority,
      changeFreq:      db?.changeFreq      ?? page.defaultFreq,
    }
  })

  return NextResponse.json(allPages)
}

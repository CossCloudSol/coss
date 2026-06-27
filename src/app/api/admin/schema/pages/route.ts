import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const SCHEMA_PAGES = [
  { slug: '/',                    name: 'Homepage',              types: ['Organization', 'WebSite', 'LocalBusiness'] },
  { slug: '/courses',             name: 'Courses listing',       types: ['ItemList'] },
  { slug: '/about-us',            name: 'About Us',              types: ['Organization'] },
  { slug: '/blog',                name: 'Blog listing',          types: ['Blog'] },
  { slug: '*-training-hyderabad', name: 'Landing pages (36)',    types: ['Course', 'FAQPage'] },
  { slug: '/courses/*/*',         name: 'Course detail pages',   types: ['Course', 'FAQPage'] },
  { slug: '/blog/*',              name: 'Blog posts',            types: ['Article'] },
  { slug: '/jobs/*',              name: 'Job listings',          types: ['JobPosting'] },
]

export async function GET(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbRows = await prisma.pageSeo.findMany({
    select: { pageSlug: true, schemaEnabled: true, schemaOverride: true },
  })
  const dbMap = new Map(dbRows.map(r => [r.pageSlug, r]))

  const pages = SCHEMA_PAGES.map(p => {
    const db = dbMap.get(p.slug)
    return {
      ...p,
      schemaEnabled:  db?.schemaEnabled  ?? true,
      schemaOverride: db?.schemaOverride ?? null,
    }
  })

  return NextResponse.json(pages)
}

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)
  const body = await req.json()

  if (body.schemaOverride) {
    try { JSON.parse(body.schemaOverride) } catch {
      return NextResponse.json({ error: 'Invalid JSON in schemaOverride' }, { status: 400 })
    }
  }

  const existing = await prisma.pageSeo.findFirst({
    where: { OR: [{ pageSlug: slug }, { pageSlug: `/${slug}` }] }
  })

  if (existing) {
    const updated = await prisma.pageSeo.update({
      where: { id: existing.id },
      data: {
        ...(body.schemaEnabled  !== undefined && { schemaEnabled:  Boolean(body.schemaEnabled) }),
        ...(body.schemaOverride !== undefined && { schemaOverride: body.schemaOverride || null }),
      },
    })
    return NextResponse.json(updated)
  }

  const created = await prisma.pageSeo.create({
    data: {
      pageSlug: slug,
      pageTitle: slug,
      schemaEnabled:  body.schemaEnabled  ?? true,
      schemaOverride: body.schemaOverride ?? null,
    },
  })
  return NextResponse.json(created)
}

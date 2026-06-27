import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { buildGlobalSchemas } from '@/lib/global-schemas'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await prisma.siteSettings.findFirst({
    select: {
      schemaOrgEnabled: true, schemaWebSiteEnabled: true,
      schemaDilsEnabled: true, schemaAmeerpetEnabled: true,
      schemaOrgOverride: true, schemaWebSiteOverride: true,
      schemaDilsOverride: true, schemaAmeerpetOverride: true,
    },
  })

  let rendered: object[] = []
  try { rendered = await buildGlobalSchemas() } catch {}

  return NextResponse.json({ settings: settings ?? {}, rendered })
}

export async function PATCH(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const existing = await prisma.siteSettings.findFirst()

  const overrideFields = [
    'schemaOrgOverride', 'schemaWebSiteOverride',
    'schemaDilsOverride', 'schemaAmeerpetOverride',
  ]
  for (const field of overrideFields) {
    if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
      try { JSON.parse(body[field]) } catch {
        return NextResponse.json(
          { error: `Invalid JSON in ${field}` },
          { status: 400 }
        )
      }
    }
  }

  if (existing) {
    const updated = await prisma.siteSettings.update({
      where: { id: existing.id },
      data: body,
    })
    return NextResponse.json(updated)
  }
  const created = await prisma.siteSettings.create({ data: body })
  return NextResponse.json(created)
}

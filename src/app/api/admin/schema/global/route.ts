import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { pickFields, SITE_SETTINGS_FIELDS } from '@/lib/pick-fields'
import type { Prisma } from '@prisma/client'
import { buildGlobalSchemas } from '@/lib/global-schemas'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const settings = await prisma.siteSettings.findFirst({
    select: {
      schemaOrgEnabled: true, schemaWebSiteEnabled: true,
      schemaOrgOverride: true, schemaWebSiteOverride: true,
    },
  })

  let rendered: object[] = []
  try { rendered = await buildGlobalSchemas() } catch {}

  return NextResponse.json({ settings: settings ?? {}, rendered })
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const picked = pickFields(await req.json().catch(() => null), SITE_SETTINGS_FIELDS)
  if ('error' in picked) return NextResponse.json({ error: picked.error }, { status: 400 })
  const body = picked.data as Record<string, string | null | undefined>
  const existing = await prisma.siteSettings.findFirst()

  const overrideFields = [
    'schemaOrgOverride', 'schemaWebSiteOverride',
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
      data: body as Prisma.SiteSettingsUpdateInput,
    })
    revalidateTag('site-settings')
    return NextResponse.json(updated)
  }
  const created = await prisma.siteSettings.create({ data: body as Prisma.SiteSettingsCreateInput })
  revalidateTag('site-settings')
  return NextResponse.json(created)
}

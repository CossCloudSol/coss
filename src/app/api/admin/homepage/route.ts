import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { pickFields, HOMEPAGE_FIELDS } from '@/lib/pick-fields'
import type { Prisma } from '@prisma/client'
import { requireAdmin } from '@/lib/admin-guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SETTINGS_ID = 'main'

export async function GET(req: NextRequest): Promise<Response> {
  try {
    let settings = await prisma.homepageSettings.findUnique({
      where: { id: SETTINGS_ID },
    })
    if (!settings) {
      settings = await prisma.homepageSettings.create({
        data: { id: SETTINGS_ID },
      })
    }
    return NextResponse.json(settings)
  } catch (error) {
    console.error('[homepage GET]', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  try {
    const picked = pickFields(await req.json().catch(() => null), HOMEPAGE_FIELDS)
    if ('error' in picked) return NextResponse.json({ error: picked.error }, { status: 400 })

    const settings = await prisma.homepageSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...picked.data } as Prisma.HomepageSettingsCreateInput,
      update: picked.data as Prisma.HomepageSettingsUpdateInput,
    })
    revalidatePath('/')
    return NextResponse.json(settings)
  } catch (error) {
    console.error('[homepage PUT]', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}

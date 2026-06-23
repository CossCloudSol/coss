import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { uploadAsset } from '@/lib/cloudinary-admin'

export const dynamic = 'force-dynamic'

const ALLOWED_SLOTS = [
  'ogImageUrl', 'logoUrl', 'logoLightUrl',
  'faviconUrl', 'appleTouchUrl', 'courseOgDefault',
] as const
type Slot = typeof ALLOWED_SLOTS[number]

export async function GET(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await prisma.siteSettings.findFirst({
    select: {
      ogImageUrl: true, logoUrl: true, logoLightUrl: true,
      faviconUrl: true, appleTouchUrl: true, courseOgDefault: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(settings ?? {})
}

export async function POST(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await req.formData()
  const slot = form.get('slot') as Slot
  const file = form.get('file') as File | null

  if (!slot || !ALLOWED_SLOTS.includes(slot)) {
    return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
  }
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const bytes  = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  try {
    const { secure_url } = await uploadAsset(buffer, file.type, 'coss/site-assets', slot)

    const existing = await prisma.siteSettings.findFirst()
    if (existing) {
      await prisma.siteSettings.update({
        where: { id: existing.id },
        data: { [slot]: secure_url },
      })
    } else {
      await prisma.siteSettings.create({ data: { [slot]: secure_url } })
    }

    return NextResponse.json({ ok: true, url: secure_url })
  } catch (err) {
    console.error('[media/key-assets POST]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

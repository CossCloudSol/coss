import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const partners = await prisma.hiringPartner.findMany({
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(partners)
}

export async function POST(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, logoUrl, altText, website, isVisible, sortOrder } = body

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const partner = await prisma.hiringPartner.create({
    data: {
      name,
      logoUrl: logoUrl ?? '',
      altText: altText ?? '',
      website: website ?? '',
      isVisible: isVisible ?? true,
      sortOrder: Number(sortOrder ?? 0),
    },
  })
  return NextResponse.json(partner)
}

import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const branches = await prisma.branchSettings.findMany({
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ branches })
}

export async function POST(req: NextRequest) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { branchKey, branchName, addressLine1, pincode, phone } = body
    if (!branchKey || !branchName) {
      return NextResponse.json({ error: 'branchKey and branchName are required' }, { status: 400 })
    }
    const row = await prisma.branchSettings.create({
      data: {
        branchKey,
        branchName,
        addressLine1: addressLine1 ?? '',
        addressLine2: '',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: pincode ?? '',
        phone: phone ?? '',
        email: 'info@cosscloudsol.com',
        latitude: 0,
        longitude: 0,
        workingHoursOpen: '09:00',
        workingHoursClose: '19:00',
        workingDays: 'Monday-Sunday',
        mapEmbedUrl: '',
        serviceAreas: '[]',
        aggregateRating: 4.8,
        reviewCount: 0,
        schemaEnabled: true,
      },
    })
    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    console.error('[geo branches POST]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

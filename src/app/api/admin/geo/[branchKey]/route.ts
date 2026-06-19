import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { branchKey: string } }
) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const row = await prisma.branchSettings.findUnique({ where: { branchKey: params.branchKey } })
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { branchKey: string } }
) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = {
      branchName:        body.branchName        ?? '',
      addressLine1:      body.addressLine1      ?? '',
      addressLine2:      body.addressLine2      ?? '',
      city:              body.city              ?? 'Hyderabad',
      state:             body.state             ?? 'Telangana',
      pincode:           body.pincode           ?? '',
      phone:             body.phone             ?? '',
      email:             body.email             ?? '',
      latitude:          parseFloat(body.latitude)  || 0,
      longitude:         parseFloat(body.longitude) || 0,
      workingHoursOpen:  body.workingHoursOpen  ?? '09:00',
      workingHoursClose: body.workingHoursClose ?? '19:00',
      workingDays:       body.workingDays       ?? 'Monday-Saturday',
      mapEmbedUrl:       body.mapEmbedUrl       ?? '',
      serviceAreas:      JSON.stringify(body.serviceAreas ?? []),
      aggregateRating:   parseFloat(body.aggregateRating) || 4.8,
      reviewCount:       parseInt(body.reviewCount)       || 0,
      schemaEnabled:     body.schemaEnabled     ?? true,
    }
    const row = await prisma.branchSettings.upsert({
      where:  { branchKey: params.branchKey },
      update: data,
      create: { branchKey: params.branchKey, ...data }
    })
    return NextResponse.json(row)
  } catch (e) {
    console.error('[geo POST]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

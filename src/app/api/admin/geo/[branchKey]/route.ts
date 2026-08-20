import { NextResponse, type NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { normalizeJsonArray } from '@/lib/get-branch-settings'

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
  return NextResponse.json({
    ...row,
    serviceAreas: normalizeJsonArray(row.serviceAreas, params.branchKey, 'serviceAreas'),
  })
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
      workingDays:       body.workingDays       ?? 'Monday-Sunday',
      mapEmbedUrl:       body.mapEmbedUrl       ?? '',
      serviceAreas:      JSON.stringify(Array.isArray(body.serviceAreas) ? body.serviceAreas : []),
      reviewCount:       parseInt(body.reviewCount)       || 0,
      schemaEnabled:     body.schemaEnabled     ?? true,
    }
    const row = await prisma.branchSettings.upsert({
      where:  { branchKey: params.branchKey },
      update: data,
      create: { branchKey: params.branchKey, ...data }
    })
    revalidateTag('branch-settings')
    return NextResponse.json(row)
  } catch (e) {
    console.error('[geo POST]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { branchKey: string } }
) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await prisma.branchSettings.delete({ where: { branchKey: params.branchKey } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[geo branches DELETE]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

import { NextResponse, type NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { branchKey: string } }
) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  try {
    await prisma.branchSettings.delete({ where: { branchKey: params.branchKey } })
    revalidateTag('branch-settings')
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[geo branches DELETE]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

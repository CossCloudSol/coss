import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { deleteAsset } from '@/lib/cloudinary-admin'

export const dynamic = 'force-dynamic'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { publicId: string[] } }
) {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Reconstruct the full Cloudinary publicId (may contain folder slashes)
  const publicId = params.publicId.map(decodeURIComponent).join('/')

  try {
    await deleteAsset(publicId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[media/assets DELETE]', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}

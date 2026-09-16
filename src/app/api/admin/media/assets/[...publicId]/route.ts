import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { deleteAsset } from '@/lib/cloudinary-admin'
import { publicIdFromUrl } from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

const KEY_ASSET_FIELDS = [
  'ogImageUrl', 'logoUrl', 'logoLightUrl',
  'faviconUrl', 'appleTouchUrl', 'courseOgDefault',
] as const

// SocialPost has no title field — identify it by the start of its content.
function excerpt(text: string, wordCount = 6): string {
  const words = text.trim().split(/\s+/)
  const truncated = words.slice(0, wordCount).join(' ')
  return words.length > wordCount ? `${truncated}…` : truncated
}

// Find every DB record whose stored URL resolves to this Cloudinary
// publicId, so a delete never orphans a still-referenced image.
async function findReferences(publicId: string): Promise<string[]> {
  const [courses, blogPosts, trainers, hiringPartners, socialPosts, siteSettings] = await Promise.all([
    prisma.course.findMany({ where: { thumbnail: { not: null } }, select: { title: true, thumbnail: true } }),
    prisma.blogPost.findMany({ where: { thumbnail: { not: null } }, select: { title: true, thumbnail: true } }),
    prisma.trainer.findMany({ where: { photoUrl: { not: null } }, select: { name: true, photoUrl: true } }),
    prisma.hiringPartner.findMany({ where: { logoUrl: { not: '' } }, select: { name: true, logoUrl: true } }),
    prisma.socialPost.findMany({ where: { imageUrl: { not: null } }, select: { content: true, imageUrl: true } }),
    prisma.siteSettings.findFirst({
      select: {
        ogImageUrl: true, logoUrl: true, logoLightUrl: true,
        faviconUrl: true, appleTouchUrl: true, courseOgDefault: true,
      },
    }),
  ])

  const references: string[] = []

  for (const c of courses) {
    if (c.thumbnail && publicIdFromUrl(c.thumbnail) === publicId) {
      references.push(`Course "${c.title}"`)
    }
  }
  for (const b of blogPosts) {
    if (b.thumbnail && publicIdFromUrl(b.thumbnail) === publicId) {
      references.push(`BlogPost "${b.title}"`)
    }
  }
  for (const t of trainers) {
    if (t.photoUrl && publicIdFromUrl(t.photoUrl) === publicId) {
      references.push(`Trainer "${t.name}"`)
    }
  }
  for (const h of hiringPartners) {
    if (h.logoUrl && publicIdFromUrl(h.logoUrl) === publicId) {
      references.push(`HiringPartner "${h.name}"`)
    }
  }
  for (const s of socialPosts) {
    if (s.imageUrl && publicIdFromUrl(s.imageUrl) === publicId) {
      references.push(`SocialPost "${excerpt(s.content)}"`)
    }
  }
  if (siteSettings) {
    for (const field of KEY_ASSET_FIELDS) {
      const url = siteSettings[field]
      if (url && publicIdFromUrl(url) === publicId) {
        references.push(`SiteSettings: ${field}`)
      }
    }
  }

  return references
}

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
    const references = await findReferences(publicId)
    if (references.length > 0) {
      return NextResponse.json(
        { error: 'Asset is in use and cannot be deleted', references },
        { status: 409 }
      )
    }

    await deleteAsset(publicId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[media/assets DELETE]', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}

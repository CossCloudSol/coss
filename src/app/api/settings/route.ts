import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const settings = await prisma.siteSettings.findFirst({
    select: {
      primaryPhone: true, secondaryPhone: true, email: true,
      whatsappNumber: true, websiteUrl: true,
      facebookUrl: true, instagramUrl: true, linkedinUrl: true,
      youtubeUrl: true, twitterUrl: true,
      orgName: true, orgFoundedYear: true, googleMapsUrl: true,
    },
  })
  return NextResponse.json(settings ?? {})
}

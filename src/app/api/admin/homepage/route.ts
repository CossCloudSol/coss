import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SETTINGS_ID = 'main'

export async function GET(req: NextRequest): Promise<Response> {
  try {
    let settings = await prisma.homepageSettings.findUnique({
      where: { id: SETTINGS_ID },
    })
    if (!settings) {
      settings = await prisma.homepageSettings.create({
        data: { id: SETTINGS_ID },
      })
    }
    return NextResponse.json(settings)
  } catch (error) {
    console.error('[homepage GET]', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next()
  const session = await getSession(req, probe)
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json() as Record<string, unknown>
    const {
      heroHeadline, heroSubtext,
      heroCTAPrimaryText, heroCTAPrimaryUrl,
      heroCTASecondaryText, heroCTASecondaryUrl,
      stat1Value, stat1Label, stat2Value, stat2Label,
      stat3Value, stat3Label, stat4Value, stat4Label,
      announcementEnabled, announcementText, announcementUrl, announcementBgColor,
      featuredCourseIds, featuredSectionTitle, featuredSectionSubtext,
      showFeaturedCourses, showTestimonials, showHiringPartners, showStats,
    } = body

    const settings = await prisma.homepageSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...body } as Parameters<typeof prisma.homepageSettings.create>[0]['data'],
      update: {
        heroHeadline: heroHeadline as string,
        heroSubtext: heroSubtext as string,
        heroCTAPrimaryText: heroCTAPrimaryText as string,
        heroCTAPrimaryUrl: heroCTAPrimaryUrl as string,
        heroCTASecondaryText: heroCTASecondaryText as string,
        heroCTASecondaryUrl: heroCTASecondaryUrl as string,
        stat1Value: stat1Value as string, stat1Label: stat1Label as string,
        stat2Value: stat2Value as string, stat2Label: stat2Label as string,
        stat3Value: stat3Value as string, stat3Label: stat3Label as string,
        stat4Value: stat4Value as string, stat4Label: stat4Label as string,
        announcementEnabled: announcementEnabled as boolean,
        announcementText: announcementText as string,
        announcementUrl: announcementUrl as string,
        announcementBgColor: announcementBgColor as string,
        featuredCourseIds: featuredCourseIds as string[],
        featuredSectionTitle: featuredSectionTitle as string,
        featuredSectionSubtext: featuredSectionSubtext as string,
        showFeaturedCourses: showFeaturedCourses as boolean,
        showTestimonials: showTestimonials as boolean,
        showHiringPartners: showHiringPartners as boolean,
        showStats: showStats as boolean,
      },
    })
    return NextResponse.json(settings)
  } catch (error) {
    console.error('[homepage PUT]', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}

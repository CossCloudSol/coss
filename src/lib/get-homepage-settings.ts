import { prisma } from '@/lib/db'

export type HomepageSettings = {
  heroHeadline: string
  heroSubtext: string
  heroCTAPrimaryText: string
  heroCTAPrimaryUrl: string
  heroCTASecondaryText: string
  heroCTASecondaryUrl: string
  stat1Value: string; stat1Label: string
  stat2Value: string; stat2Label: string
  stat3Value: string; stat3Label: string
  stat4Value: string; stat4Label: string
  announcementEnabled: boolean
  announcementText: string
  announcementUrl: string
  announcementBgColor: string
  featuredCourseIds: string[]
  featuredSectionTitle: string
  featuredSectionSubtext: string
  showFeaturedCourses: boolean
  showTestimonials: boolean
  showHiringPartners: boolean
  showStats: boolean
}

const DEFAULTS: HomepageSettings = {
  heroHeadline: 'Launch Your IT Career in Hyderabad',
  heroSubtext: 'Expert-led courses. Real-world projects. Job-ready skills to launch your dream career in Hyderabad.',
  heroCTAPrimaryText: 'Enroll Now',
  heroCTAPrimaryUrl: '/enroll-now-with-coss',
  heroCTASecondaryText: 'Free Demo Class',
  heroCTASecondaryUrl: '/free-demo-class',
  stat1Value: '15+', stat1Label: 'Expert Trainers',
  stat2Value: '5000+', stat2Label: 'Industry Recognized',
  stat3Value: '30+', stat3Label: 'Placement Assistance',
  stat4Value: '50+', stat4Label: 'Career Growth',
  announcementEnabled: true,
  announcementText: 'Next batch starts 1 Jul 2026 — Limited seats available!',
  announcementUrl: '/enroll-now-with-coss',
  announcementBgColor: '#f97316',
  featuredCourseIds: [],
  featuredSectionTitle: 'Popular Courses',
  featuredSectionSubtext: 'Industry-relevant curriculum built for the Hyderabad job market.',
  showFeaturedCourses: true,
  showTestimonials: true,
  showHiringPartners: true,
  showStats: true,
}

export async function getHomepageSettings(): Promise<HomepageSettings> {
  try {
    const settings = await prisma.homepageSettings.findUnique({
      where: { id: 'main' },
    })
    return (settings as unknown as HomepageSettings) ?? DEFAULTS
  } catch {
    return DEFAULTS
  }
}

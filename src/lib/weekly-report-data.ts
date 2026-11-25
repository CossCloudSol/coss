import { prisma } from '@/lib/db'
import { NOT_SPAM } from '@/lib/lead-spam'
import { buildWeeklyReport, reportWeeks, type WeeklyReport } from '@/lib/weekly-report'

/** Reads the two weeks of existing rows (read-only) and summarizes them. */
export async function loadWeeklyReport(now: Date = new Date()): Promise<WeeklyReport> {
  const { current, previous } = reportWeeks(now)
  const createdAt = { gte: previous.start, lt: current.end }
  const [leads, corporate, whatsapp, calls, cta] = await Promise.all([
    prisma.lead.findMany({ where: { ...NOT_SPAM, createdAt }, select: { createdAt: true, utmSource: true, utmMedium: true, referrer: true, gclid: true, fbclid: true } }),
    prisma.corporateLead.findMany({ where: { ...NOT_SPAM, createdAt }, select: { createdAt: true } }),
    prisma.whatsAppClick.findMany({ where: { createdAt }, select: { createdAt: true, utmSource: true, utmMedium: true, referrer: true, courseSlug: true, refCode: true } }),
    prisma.callClick.findMany({ where: { createdAt }, select: { createdAt: true, courseSlug: true } }),
    prisma.ctaClick.findMany({ where: { createdAt }, select: { createdAt: true, kind: true, courseSlug: true } }),
  ])
  return buildWeeklyReport({ leads, corporate, whatsapp, calls, cta }, now)
}

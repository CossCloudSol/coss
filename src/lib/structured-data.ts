// JSON-LD builders shared by every page that emits structured data (item 9).
// Dependency-free (unit-tested in scripts/test/structured-data.test.mjs): pages
// fetch the data and pass plain values in. Conventions:
//  - one @graph per page block, every node with a stable @id (canonical URL + "#…")
//  - the organization is declared once, sitewide (src/lib/global-schemas.ts);
//    everything else points at it with { '@id': ORG_ID } and never redeclares it
//  - nothing is invented: a value that isn't in the data is left out
//  - no Review / AggregateRating anywhere (Google's self-serving review rule)

import { BRAND_NAME } from '@/lib/nap'

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com'
export const ORG_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`
export const LOGO_URL = `${SITE_URL}/logo.png`
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`

export type JsonLdNode = Record<string, unknown>

/** One <script type="application/ld+json"> payload; null when there is nothing to emit. */
export function jsonLdGraph(nodes: Array<JsonLdNode | null | undefined | false>): JsonLdNode | null {
  const graph = nodes.filter((n): n is JsonLdNode => !!n)
  return graph.length ? { '@context': 'https://schema.org', '@graph': graph } : null
}

/* ── Breadcrumbs and FAQs ─────────────────────────────────────────────── */

export type Crumb = { name: string; url: string }

export function breadcrumbList(pageUrl: string, crumbs: Crumb[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
  }
}

export type Faq = { q: string; a: string }

/** Every FAQ the page shows, in the same order; null when it shows none. */
export function faqPage(pageUrl: string, faqs: ReadonlyArray<Faq>): JsonLdNode | null {
  if (faqs.length === 0) return null
  return {
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
}

/* ── Batch schedules → schema.org Schedule ────────────────────────────── */

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
type Day = (typeof DAYS)[number]
const dayAt = (word: string): number => DAYS.findIndex((d) => d.toLowerCase().startsWith(word.toLowerCase().slice(0, 3)))

export type ParsedSchedule = { byDay: Day[]; startTime: string; endTime: string; minutes: number }

function to24h(h: number, m: number, ampm: string): number {
  const pm = ampm.toLowerCase() === 'pm'
  const hour = (h % 12) + (pm ? 12 : 0)
  return hour * 60 + m
}
const hhmm = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`

/**
 * Batch.schedule as admins type it: "Mon-Sat 7PM-8PM", "Mon to Friday 2PM TO 4PM",
 * "Weekdays 6PM–9PM", "Mon-Sat 5pm to 6pm". Null when the days or the times
 * can't be read with certainty.
 */
export function parseBatchSchedule(raw: string | null | undefined): ParsedSchedule | null {
  const s = (raw ?? '').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim()
  if (!s) return null
  let byDay: Day[] | null = null
  if (/\bweek\s?days?\b/i.test(s)) byDay = DAYS.slice(0, 5) as Day[]
  else if (/\bweek\s?ends?\b/i.test(s)) byDay = ['Saturday', 'Sunday']
  else if (/\b(daily|all days|every ?day)\b/i.test(s)) byDay = [...DAYS]
  else {
    const range = s.match(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?\s*(?:to|-)\s*(mon|tue|wed|thu|fri|sat|sun)[a-z]*/i)
    if (range) {
      const from = dayAt(range[1])
      const to = dayAt(range[2])
      if (from >= 0 && to >= from) byDay = DAYS.slice(from, to + 1) as Day[]
    }
  }
  const t = s.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)\s*(?:to|-)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)\b/i)
  if (!byDay || !t) return null
  const [h1, m1, h2, m2] = [t[1], t[2], t[4], t[5]].map((v) => Number(v ?? 0))
  if (h1 < 1 || h1 > 12 || h2 < 1 || h2 > 12) return null
  const start = to24h(h1, m1, t[3])
  const end = to24h(h2, m2, t[6])
  const minutes = end - start
  if (minutes <= 0 || minutes > 12 * 60) return null
  return { byDay, startTime: hhmm(start), endTime: hhmm(end), minutes }
}

/** "2 Months", "45 Days", "6 weeks", "3 month" → end date from the start; null otherwise. */
export function endFromDuration(start: Date, duration: string | null | undefined): Date | null {
  const m = (duration ?? '').match(/^\s*(\d+(?:\.\d+)?)\s*(day|week|month)s?\b/i)
  if (!m) return null
  const n = Number(m[1])
  const end = new Date(start)
  const unit = m[2].toLowerCase()
  if (unit === 'day') end.setUTCDate(end.getUTCDate() + Math.round(n))
  else if (unit === 'week') end.setUTCDate(end.getUTCDate() + Math.round(n * 7))
  else end.setUTCMonth(end.getUTCMonth() + Math.round(n))
  return end
}

/** Sessions between start and end (inclusive) on the given weekdays. */
export function countSessions(start: Date, end: Date, byDay: Day[]): number {
  let n = 0
  const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
  const last = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  for (let guard = 0; d.getTime() <= last && guard < 800; guard++) {
    if (byDay.includes(DAYS[(d.getUTCDay() + 6) % 7])) n++
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return n
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10)
const isoDuration = (minutes: number) => `PT${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}H` : ''}${minutes % 60 ? `${minutes % 60}M` : ''}`

/* ── Course ───────────────────────────────────────────────────────────── */

export type CourseBatch = {
  batchName?: string | null
  mode: string
  centre: string | null
  startDate: Date | string
  endDate?: Date | string | null
  schedule: string
}

export type CentrePlace = {
  name: string
  streetAddress: string
  addressLocality: string
  addressRegion: string
  postalCode: string
}

export type CourseGraphInput = {
  /** The course's canonical URL (no trailing slash). */
  url: string
  name: string
  description: string
  /** Course.price, INR. */
  price?: number | null
  /** Course.duration ("2 Months"): sizes a batch without an end date. */
  duration?: string | null
  batches: ReadonlyArray<CourseBatch>
  /** Centres by lower-case key ("dilsukhnagar", "ameerpet"), from BranchSettings. */
  centres: Readonly<Record<string, CentrePlace>>
}

function courseInstance(b: CourseBatch, input: CourseGraphInput): JsonLdNode | null {
  const start = new Date(b.startDate)
  if (Number.isNaN(start.getTime())) return null
  const explicitEnd = b.endDate ? new Date(b.endDate) : null
  const end = explicitEnd && !Number.isNaN(explicitEnd.getTime()) ? explicitEnd : endFromDuration(start, input.duration)
  const online = /online/i.test(b.mode)
  const centre = b.centre ? input.centres[b.centre.trim().toLowerCase()] : undefined
  const parsed = parseBatchSchedule(b.schedule)
  const sessions = parsed && end ? countSessions(start, end, parsed.byDay) : 0
  return {
    '@type': 'CourseInstance',
    ...(b.batchName ? { name: b.batchName } : {}),
    courseMode: online ? 'Online' : 'Onsite',
    startDate: isoDate(start),
    ...(explicitEnd && !Number.isNaN(explicitEnd.getTime()) ? { endDate: isoDate(explicitEnd) } : {}),
    ...(!online && centre
      ? {
          location: {
            '@type': 'Place',
            name: centre.name,
            address: {
              '@type': 'PostalAddress',
              streetAddress: centre.streetAddress,
              addressLocality: centre.addressLocality,
              addressRegion: centre.addressRegion,
              postalCode: centre.postalCode,
              addressCountry: 'IN',
            },
          },
        }
      : {}),
    ...(parsed && sessions > 0
      ? {
          courseSchedule: {
            '@type': 'Schedule',
            repeatFrequency: 'Daily',
            byDay: parsed.byDay.map((d) => `https://schema.org/${d}`),
            startTime: parsed.startTime,
            endTime: parsed.endTime,
            duration: isoDuration(parsed.minutes),
            repeatCount: sessions,
            scheduleTimezone: 'Asia/Kolkata',
          },
          courseWorkload: isoDuration(parsed.minutes * sessions),
        }
      : {}),
  }
}

/** The Course node: @id = canonical URL + "#course", provider → #organization, DB price, DB batches. */
export function courseNode(input: CourseGraphInput): JsonLdNode {
  const instances = input.batches.map((b) => courseInstance(b, input)).filter((n): n is JsonLdNode => !!n)
  return {
    '@type': 'Course',
    '@id': `${input.url}#course`,
    name: input.name,
    description: input.description,
    url: input.url,
    inLanguage: 'en-IN',
    provider: { '@id': ORG_ID },
    offers: {
      '@type': 'Offer',
      category: 'Paid',
      ...(typeof input.price === 'number' && input.price > 0 ? { price: input.price, priceCurrency: 'INR' } : {}),
      url: input.url,
    },
    ...(instances.length ? { hasCourseInstance: instances } : {}),
  }
}

/* ── Category pages: CollectionPage + ItemList ─────────────────────────── */

export function collectionPage(input: { url: string; name: string; description?: string; items: ReadonlyArray<Crumb> }): JsonLdNode[] {
  return [
    {
      '@type': 'CollectionPage',
      '@id': `${input.url}#webpage`,
      url: input.url,
      name: input.name,
      ...(input.description ? { description: input.description } : {}),
      isPartOf: { '@id': WEBSITE_ID },
      breadcrumb: { '@id': `${input.url}#breadcrumb` },
      mainEntity: { '@id': `${input.url}#itemlist` },
      inLanguage: 'en-IN',
    },
    {
      '@type': 'ItemList',
      '@id': `${input.url}#itemlist`,
      numberOfItems: input.items.length,
      itemListElement: input.items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, url: c.url })),
    },
  ]
}

/* ── Blog ─────────────────────────────────────────────────────────────── */

/** A bare date ("2026-05-17") as the start of that day in India; Google wants a time and timezone. */
export function isoDateTime(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00+05:30` : value
}

export function blogPosting(input: {
  url: string
  headline: string
  description?: string
  image?: string | null
  datePublished?: string | null
  dateModified?: string | null
}): JsonLdNode {
  return {
    '@type': 'BlogPosting',
    '@id': `${input.url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    headline: input.headline.length > 110 ? `${input.headline.slice(0, 109).trimEnd()}…` : input.headline,
    ...(input.description ? { description: input.description } : {}),
    image: [input.image || DEFAULT_IMAGE],
    ...(input.datePublished ? { datePublished: isoDateTime(input.datePublished) } : {}),
    ...(input.dateModified || input.datePublished ? { dateModified: isoDateTime(input.dateModified || input.datePublished!) } : {}),
    author: { '@type': 'Organization', name: BRAND_NAME, url: SITE_URL },
    // Named here (no @id) so the article carries the logo Google asks for without redeclaring #organization.
    publisher: { '@type': 'Organization', name: BRAND_NAME, url: SITE_URL, logo: { '@type': 'ImageObject', url: LOGO_URL } },
    inLanguage: 'en-IN',
  }
}

/* ── Jobs ─────────────────────────────────────────────────────────────── */

const EMPLOYMENT_TYPES: Record<string, string> = {
  'full time': 'FULL_TIME', 'full-time': 'FULL_TIME', fulltime: 'FULL_TIME',
  'part time': 'PART_TIME', 'part-time': 'PART_TIME', parttime: 'PART_TIME',
  internship: 'INTERN', intern: 'INTERN',
  contract: 'CONTRACTOR', contractor: 'CONTRACTOR', freelance: 'CONTRACTOR',
  temporary: 'TEMPORARY', temp: 'TEMPORARY',
}

/** Admin job type ("Full Time", "Internship", "Contract") → Google's employmentType; undefined when unknown. */
export function employmentType(type: string | null | undefined): string | undefined {
  return EMPLOYMENT_TYPES[(type ?? '').trim().toLowerCase()]
}

/** A job without an expiry is listed for this many days after it was posted. */
export const JOB_LISTING_DAYS = 60

export function jobPosting(job: {
  url: string
  id: string
  title: string
  description: string
  company: string
  location: string
  type: string
  mode: string
  postedAt: Date | string
  expiresAt?: Date | string | null
}): JsonLdNode {
  const posted = new Date(job.postedAt)
  const validThrough = job.expiresAt ? new Date(job.expiresAt) : new Date(posted.getTime() + JOB_LISTING_DAYS * 86_400_000)
  const remote = /remote|work from home|wfh/i.test(job.mode)
  const type = employmentType(job.type)
  return {
    '@type': 'JobPosting',
    '@id': `${job.url}#job`,
    title: job.title,
    description: job.description,
    identifier: { '@type': 'PropertyValue', name: BRAND_NAME, value: job.id },
    datePosted: posted.toISOString(),
    validThrough: validThrough.toISOString(),
    ...(type ? { employmentType: type } : {}),
    hiringOrganization: { '@type': 'Organization', name: job.company },
    ...(remote
      ? { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'India' } }
      : {
          jobLocation: {
            '@type': 'Place',
            address: { '@type': 'PostalAddress', addressLocality: job.location || 'Hyderabad', addressRegion: 'Telangana', addressCountry: 'IN' },
          },
        }),
    directApply: false,
  }
}

/* ── Seeded PageSeo.schemaMarkup on the static pages ───────────────────── */

// Nodes the seeds may not carry: the organization is declared once sitewide,
// Course/Offer data comes from the course builder, the seeded Event has no
// date or place, and the static pages show no FAQ block of their own.
const SEED_DROP_TYPES = new Set([
  'Organization', 'EducationalOrganization', 'LocalBusiness', 'Course', 'CourseInstance',
  'OfferCatalog', 'Offer', 'Event', 'FAQPage', 'Review', 'AggregateRating', 'WebSite',
])

const typesOf = (n: unknown): string[] => {
  const t = (n as JsonLdNode | null)?.['@type']
  return Array.isArray(t) ? t.map(String) : t ? [String(t)] : []
}

function hasBanned(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasBanned)
  if (value && typeof value === 'object') {
    const node = value as JsonLdNode
    if (typesOf(node).some((t) => t === 'Review' || t === 'AggregateRating')) return true
    if ('aggregateRating' in node || 'review' in node) return true
    return Object.values(node).some(hasBanned)
  }
  return false
}

/** "https://www.cosscloudsol.com/about-us/" → ".../about-us" (the trailing-slash form redirects). */
function untrail(value: unknown): unknown {
  if (typeof value === 'string') return value.startsWith(`${SITE_URL}/`) && value.length > SITE_URL.length + 1 && value.endsWith('/') ? value.slice(0, -1) : value
  if (Array.isArray(value)) return value.map(untrail)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, untrail(v)]))
  return value
}

/**
 * A static page's seeded schemaMarkup, made safe to render: invalid JSON →
 * null; nodes that would redeclare #organization, duplicate a builder's output
 * or carry ratings are dropped (a breadcrumb inside a kept node is lifted out
 * as its own node); site URLs lose the trailing slash. Null when nothing is left.
 */
/** alsoDrop: types the page already emits itself (e.g. BreadcrumbList on a course page). */
export function filterSeedSchema(raw: string | null | undefined, alsoDrop: ReadonlyArray<string> = []): JsonLdNode | null {
  if (!raw || !raw.trim()) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const top = parsed as JsonLdNode
  const nodes: unknown[] = Array.isArray(top['@graph']) ? (top['@graph'] as unknown[]) : [top]
  const kept: JsonLdNode[] = []
  for (const n of nodes) {
    if (!n || typeof n !== 'object') continue
    const node = { ...(n as JsonLdNode) }
    delete node['@context']
    if (node['@id'] === ORG_ID || typesOf(node).some((t) => SEED_DROP_TYPES.has(t) || alsoDrop.includes(t)) || hasBanned(node)) continue
    const crumb = node.breadcrumb as JsonLdNode | undefined
    if (crumb && typesOf(crumb).includes('BreadcrumbList')) {
      if (!alsoDrop.includes('BreadcrumbList')) kept.push(crumb)
      delete node.breadcrumb
    }
    kept.push(node)
  }
  // A trail needs at least two steps (a lone 'Home' says nothing).
  const useful = kept.filter((n) => !typesOf(n).includes('BreadcrumbList') || (Array.isArray(n.itemListElement) && n.itemListElement.length >= 2))
  return jsonLdGraph(untrail(useful) as JsonLdNode[])
}

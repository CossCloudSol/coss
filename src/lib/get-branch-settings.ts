import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/db'

/**
 * BranchSettings.serviceAreas is stored as a JSON-encoded string column.
 * A prior admin write path double-encoded it (JSON.stringify of an
 * already-stringified value), so a single JSON.parse can yield a string
 * instead of an array. Guard against that — and any other malformed value —
 * rather than letting `.map()` crash the locality page render.
 */
export function normalizeJsonArray(value: unknown, branchKey: string, field: string): string[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // falls through to the warning below
    }
  }
  console.warn(`[getBranchSettings] "${field}" for branch "${branchKey}" was not a valid array (typeof=${typeof value}); falling back to []`)
  return []
}

/**
 * Only these branchKeys are real, live branches. Any other BranchSettings
 * row (e.g. a stray/duplicate GBP listing entered by mistake) is filtered
 * out of getAllBranchSettings() so it can never leak into a page or sitemap.
 */
export const LIVE_BRANCH_KEYS = ['dilsukhnagar', 'ameerpet'] as const

export type BranchSettings = {
  id: string
  branchKey: string
  branchName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
  phone: string
  email: string
  latitude: number
  longitude: number
  workingHoursOpen: string
  workingHoursClose: string
  workingDays: string
  mapEmbedUrl: string
  serviceAreas: string[]
  aggregateRating?: number
  reviewCount: number
  schemaEnabled: boolean
}

/**
 * Google Business Profile identity binding — one canonical Maps CID per real,
 * live branch. Used as `sameAs` on the branch's LocalBusiness schema so
 * search engines resolve the schema entity to the actual GBP listing.
 * Keyed by branchKey so new branches follow the same pattern; branches with
 * no entry here simply emit no `sameAs`.
 */
export const GBP_SAME_AS: Record<string, string> = {
  dilsukhnagar: 'https://maps.google.com/?cid=11978838050055640290',
  ameerpet: 'https://maps.google.com/?cid=9517745032412619256',
}

export const FALLBACK: Record<string, BranchSettings> = {
  dilsukhnagar: {
    id: 'branch_dilsukhnagar',
    branchKey: 'dilsukhnagar',
    branchName: 'Coss Cloud Solutions — Dilsukhnagar',
    addressLine1: 'Flat 109, CB Eastern Homes, Kamala Nagar',
    addressLine2: 'Dilsukhnagar',
    city: 'Hyderabad', state: 'Telangana', pincode: '500060',
    phone: '+91 88851 66007', email: 'info@cosscloudsol.com',
    latitude: 17.367741, longitude: 78.528543,
    workingHoursOpen: '09:00', workingHoursClose: '19:00',
    workingDays: 'Monday-Sunday', mapEmbedUrl: '',
    serviceAreas: ['Dilsukhnagar','LB Nagar','Kothapet','Malakpet','Nagole'],
    reviewCount: 0, schemaEnabled: true
  },
  ameerpet: {
    id: 'branch_ameerpet',
    branchKey: 'ameerpet',
    branchName: 'Coss Cloud Solutions — Ameerpet',
    addressLine1: '#502, Sree Swathi Ankur Building',
    addressLine2: 'Besides Aditya Trade Center, Ameerpet',
    city: 'Hyderabad', state: 'Telangana', pincode: '500016',
    phone: '+91 88851 66007', email: 'info@cosscloudsol.com',
    latitude: 17.436986, longitude: 78.447128,
    workingHoursOpen: '09:00', workingHoursClose: '19:00',
    workingDays: 'Monday-Sunday', mapEmbedUrl: '',
    serviceAreas: ['Ameerpet','Punjagutta','SR Nagar','Begumpet','Somajiguda'],
    reviewCount: 0, schemaEnabled: true
  }
}

const getCachedBranchRow = unstable_cache(
  (branchKey: string) => prisma.branchSettings.findUnique({ where: { branchKey } }),
  ['branch-settings-by-key'],
  { tags: ['branch-settings'], revalidate: 86400 },
)

const getCachedBranchRows = unstable_cache(
  () => prisma.branchSettings.findMany({ orderBy: { branchKey: 'asc' } }),
  ['branch-settings-all'],
  { tags: ['branch-settings'], revalidate: 86400 },
)

export async function getBranchSettings(branchKey: string): Promise<BranchSettings> {
  try {
    const row = await getCachedBranchRow(branchKey)
    if (!row) {
      console.log(`[getBranchSettings] no BranchSettings row for "${branchKey}", using fallback NAP constants`)
      return FALLBACK[branchKey] ?? FALLBACK.dilsukhnagar
    }
    return {
      ...row,
      serviceAreas: normalizeJsonArray(row.serviceAreas, branchKey, 'serviceAreas')
    }
  } catch (e) {
    console.log(`[getBranchSettings] error loading "${branchKey}", using fallback NAP constants:`, e)
    return FALLBACK[branchKey] ?? FALLBACK.dilsukhnagar
  }
}

export async function getAllBranchSettings(): Promise<BranchSettings[]> {
  try {
    const rows = await getCachedBranchRows()
    return rows
      .filter(r => (LIVE_BRANCH_KEYS as readonly string[]).includes(r.branchKey))
      .map(r => ({ ...r, serviceAreas: normalizeJsonArray(r.serviceAreas, r.branchKey, 'serviceAreas') }))
  } catch {
    return Object.values(FALLBACK)
  }
}

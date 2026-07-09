import { prisma } from '@/lib/db'

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
  aggregateRating: number
  reviewCount: number
  schemaEnabled: boolean
}

const FALLBACK: Record<string, BranchSettings> = {
  dilsukhnagar: {
    id: 'branch_dilsukhnagar',
    branchKey: 'dilsukhnagar',
    branchName: 'Coss Cloud Solutions — Dilsukhnagar',
    addressLine1: 'Flat 109, CB Eastern Homes, Kamala Nagar',
    addressLine2: 'Dilsukhnagar',
    city: 'Hyderabad', state: 'Telangana', pincode: '500060',
    phone: '+91 88851 66007', email: 'info@cosscloudsol.com',
    latitude: 17.3617, longitude: 78.5262,
    workingHoursOpen: '09:00', workingHoursClose: '19:00',
    workingDays: 'Monday-Sunday', mapEmbedUrl: '',
    serviceAreas: ['Dilsukhnagar','LB Nagar','Kothapet','Malakpet','Nagole'],
    aggregateRating: 4.8, reviewCount: 1250, schemaEnabled: true
  },
  ameerpet: {
    id: 'branch_ameerpet',
    branchKey: 'ameerpet',
    branchName: 'Coss Cloud Solutions — Ameerpet',
    addressLine1: '#502, Sree Swathi Ankur Building',
    addressLine2: 'Besides Aditya Trade Center, Ameerpet',
    city: 'Hyderabad', state: 'Telangana', pincode: '500038',
    phone: '+91 77807 27374', email: 'info@cosscloudsol.com',
    latitude: 17.4375, longitude: 78.4482,
    workingHoursOpen: '09:00', workingHoursClose: '19:00',
    workingDays: 'Monday-Sunday', mapEmbedUrl: '',
    serviceAreas: ['Ameerpet','Punjagutta','SR Nagar','Begumpet','Somajiguda'],
    aggregateRating: 4.8, reviewCount: 980, schemaEnabled: true
  }
}

export async function getBranchSettings(branchKey: string): Promise<BranchSettings> {
  try {
    const row = await prisma.branchSettings.findUnique({ where: { branchKey } })
    if (!row) return FALLBACK[branchKey] ?? FALLBACK.dilsukhnagar
    return {
      ...row,
      serviceAreas: JSON.parse(row.serviceAreas || '[]')
    }
  } catch {
    return FALLBACK[branchKey] ?? FALLBACK.dilsukhnagar
  }
}

export async function getAllBranchSettings(): Promise<BranchSettings[]> {
  try {
    const rows = await prisma.branchSettings.findMany({ orderBy: { branchKey: 'asc' } })
    return rows.map(r => ({ ...r, serviceAreas: JSON.parse(r.serviceAreas || '[]') }))
  } catch {
    return Object.values(FALLBACK)
  }
}

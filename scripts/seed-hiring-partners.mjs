import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const BASE = 'https://res.cloudinary.com/dfditihuw/image/upload/cosscloudsol/site-images/nextjs-cosscloudsol-com/wp-content/uploads/2021/12'

const partners = [
  { name: 'Google',            logoUrl: `${BASE}/google-jpg.webp`,                        altText: 'Google — Coss Cloud Solutions hiring partner',              website: 'https://www.google.com',              sortOrder: 1 },
  { name: 'IBM',               logoUrl: `${BASE}/ibm-jpg.webp`,                           altText: 'IBM — Coss Cloud Solutions hiring partner',                 website: 'https://www.ibm.com',                 sortOrder: 2 },
  { name: 'Oracle',            logoUrl: `${BASE}/oracle-jpg.webp`,                        altText: 'Oracle — Coss Cloud Solutions hiring partner',              website: 'https://www.oracle.com',              sortOrder: 3 },
  { name: 'Wipro',             logoUrl: `${BASE}/wipro-jpg.webp`,                         altText: 'Wipro — Coss Cloud Solutions hiring partner',               website: 'https://www.wipro.com',               sortOrder: 4 },
  { name: 'TCS',               logoUrl: `${BASE}/tcs-jpg.webp`,                           altText: 'Tata Consultancy Services — Coss hiring partner',           website: 'https://www.tcs.com',                 sortOrder: 5 },
  { name: 'HCL Technologies',  logoUrl: `${BASE}/hcl-jpg.webp`,                           altText: 'HCL Technologies — Coss Cloud Solutions hiring partner',    website: 'https://www.hcltech.com',             sortOrder: 6 },
  { name: 'Tech Mahindra',     logoUrl: `${BASE}/tech_mahindra-jpg.webp`,                 altText: 'Tech Mahindra — Coss Cloud Solutions hiring partner',       website: 'https://www.techmahindra.com',         sortOrder: 7 },
  { name: 'Airtel',            logoUrl: `${BASE}/airtel-jpg.webp`,                        altText: 'Airtel — Coss Cloud Solutions hiring partner',              website: 'https://www.airtel.in',               sortOrder: 8 },
  { name: 'Genpact',           logoUrl: `${BASE}/genpact-jpg.webp`,                       altText: 'Genpact — Coss Cloud Solutions hiring partner',             website: 'https://www.genpact.com',             sortOrder: 9 },
  { name: 'Synopsys',          logoUrl: `${BASE}/synopsys-jpg.webp`,                      altText: 'Synopsys — Coss Cloud Solutions hiring partner',            website: 'https://www.synopsys.com',            sortOrder: 10 },
  { name: 'Sonata Software',   logoUrl: `${BASE}/sonata-jpg.webp`,                        altText: 'Sonata Software — Coss Cloud Solutions hiring partner',     website: 'https://www.sonata-software.com',     sortOrder: 11 },
  { name: 'ADP',               logoUrl: `${BASE}/adp-jpg.webp`,                           altText: 'ADP — Coss Cloud Solutions hiring partner',                 website: 'https://www.adp.com',                 sortOrder: 12 },
  { name: 'JPMorgan Chase',    logoUrl: `${BASE}/jpmorgan-chase-co-logo-200x80-jpg.webp`, altText: 'JPMorgan Chase — Coss Cloud Solutions hiring partner',      website: 'https://www.jpmorganchase.com',        sortOrder: 13 },
  { name: 'Wells Fargo',       logoUrl: `${BASE}/wells_fargo-jpg.webp`,                   altText: 'Wells Fargo — Coss Cloud Solutions hiring partner',         website: 'https://www.wellsfargo.com',          sortOrder: 14 },
  { name: 'Ericsson',          logoUrl: `${BASE}/ericsson-jpg.webp`,                      altText: 'Ericsson — Coss Cloud Solutions hiring partner',            website: 'https://www.ericsson.com',            sortOrder: 15 },
  { name: 'HSBC',              logoUrl: `${BASE}/hsbc-jpg.webp`,                          altText: 'HSBC — Coss Cloud Solutions hiring partner',                website: 'https://www.hsbc.com',                sortOrder: 16 },
  { name: 'Bank of America',   logoUrl: `${BASE}/bank_of_america-jpg.webp`,               altText: 'Bank of America — Coss Cloud Solutions hiring partner',     website: 'https://www.bankofamerica.com',        sortOrder: 17 },
]

async function main() {
  console.log('Seeding hiring partners...')
  for (const partner of partners) {
    const existing = await prisma.hiringPartner.findFirst({
      where: { name: partner.name }
    })
    if (existing) {
      console.log(`  ⏭ Skipping ${partner.name} (already exists)`)
      continue
    }
    await prisma.hiringPartner.create({ data: partner })
    console.log(`  ✓ ${partner.name}`)
  }
  console.log('Done.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

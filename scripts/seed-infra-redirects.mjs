/**
 * scripts/seed-infra-redirects.mjs
 *
 * Seeds the 5 infrastructure redirect pairs (10 rules total) into the Redirect
 * table so they appear in the admin panel for visibility and auditing.
 *
 * These same rules are also hardcoded in src/lib/sync-redirects.ts (INFRA_REDIRECTS)
 * so they survive even if the DB sync wipes the config before this seed runs.
 *
 * Usage:  node scripts/seed-infra-redirects.mjs
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const INFRA_REDIRECTS = [
  { source: '/data-analytics-bi',                           destination: '/courses/data-analytics-bi'      },
  { source: '/data-analytics-bi/',                          destination: '/courses/data-analytics-bi'      },
  { source: '/software-testing-os',                         destination: '/courses/software-testing-os'    },
  { source: '/software-testing-os/',                        destination: '/courses/software-testing-os'    },
  { source: '/courses/cyber-security-networking',           destination: '/courses/cyber-security'         },
  { source: '/courses/cyber-security-networking/',          destination: '/courses/cyber-security'         },
  { source: '/courses/programming-full-stack-development',  destination: '/courses/programming-full-stack' },
  { source: '/courses/programming-full-stack-development/', destination: '/courses/programming-full-stack' },
  { source: '/blogs',                                       destination: '/blog'                           },
  { source: '/blogs/',                                      destination: '/blog'                           },
]

async function main() {
  let created = 0
  let skipped = 0

  for (const rule of INFRA_REDIRECTS) {
    const existing = await db.redirect.findUnique({ where: { source: rule.source } })
    if (existing) {
      console.log(`  skip  ${rule.source} (already exists → ${existing.destination})`)
      skipped++
    } else {
      await db.redirect.create({
        data: { source: rule.source, destination: rule.destination, statusCode: 301, isActive: true },
      })
      console.log(`  create ${rule.source} → ${rule.destination}`)
      created++
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())

/**
 * scripts/seed-gsc-404-fixes.mjs
 *
 * Seeds the 13 DB redirect rules that resolve the remaining GSC 404 bucket
 * (the URLs not already healed by the SLUG_MAP fix in get-landing-page-data.ts).
 * Sources are stored WITHOUT trailing slashes — trailingSlash:false in next.config.mjs
 * normalises incoming slash variants before config redirects fire.
 *
 * Usage: node scripts/seed-gsc-404-fixes.mjs && node scripts/run-sync-redirects.mjs
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const REDIRECTS = [
  ['/courses/cloud-data-engineer-training-in-hyderabad',              '/data-engineering-python-training-in-hyderabad'],
  ['/courses/oracle-fusion-cloud-hcm-training-in-hyderabad',          '/salesforce-admin-developer-training-in-hyderabad'],
  ['/courses/salesforce-training-center-in-hyderabad',                '/salesforce-training-institute-in-hyderabad'],
  ['/courses/multi-cloud-engineer-training-in-hyderabad',             '/multi-cloud-architecture-training-in-hyderabad'],
  ['/digital-marketing-course-in-hyderabad-with-coss-cloud-solutions','/digital-marketing-training-institute-in-hyderabad'],
  ['/courses/tally-classes-in-hyderabad',                             '/tally-erp-training-institute-in-hyderabad'],
  ['/courses/ms-office',                                              '/ms-office-training-institute-in-hyderabad'],
  ['/python-full-stack-course-in-hyderabad-with-coss-cloud-solutions','/python-training-institute-in-hyderabad'],
  ['/courses/aws-cloud-training-center-in-hyderabad',                 '/aws-solutions-architect-training-in-hyderabad'],
  ['/courses/data-science',                                           '/courses/data-analytics-bi'],
  ['/courses/linux-training-center-in-hyderabad',                     '/linux-shell-scripting-training-in-hyderabad'],
  ['/courses/linux',                                                  '/linux-shell-scripting-training-in-hyderabad'],
  ['/courses/sql-mysql-postgresql',                                   '/sql-data-analytics-training-hyderabad'],
]

async function main() {
  const seen = new Set()
  let created = 0
  let skipped = 0

  for (const [source, destination] of REDIRECTS) {
    if (seen.has(source)) continue
    seen.add(source)

    const existing = await db.redirect.findUnique({ where: { source } })
    if (existing) {
      console.log(`  skip  ${source} (already exists → ${existing.destination})`)
      skipped++
    } else {
      await db.redirect.create({
        data: { source, destination, statusCode: 301, isActive: true },
      })
      console.log(`  create ${source} → ${destination}`)
      created++
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())

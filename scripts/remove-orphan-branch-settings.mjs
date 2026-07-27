/**
 * scripts/remove-orphan-branch-settings.mjs
 *
 * One-off cleanup: deletes the 3 BranchSettings rows for GBP listings that
 * were duplicate/clustered at the Dilsukhnagar address and are being
 * merged/closed client-side. Confirmed live branches are dilsukhnagar and
 * ameerpet only. These 3 stray rows previously caused a build-blocking
 * serviceAreas failure.
 *
 * Prints each row's full contents before deletion as an audit trail — these
 * were real GBP listings, not test data.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const ORPHAN_BRANCH_KEYS = [
  'complete-open-source-solutions-coss',
  'toss-hyderabad-dilsukhnagar',
  'cossdigiai-cyberdata-academy',
]

async function main() {
  const rows = await db.branchSettings.findMany({
    where: { branchKey: { in: ORPHAN_BRANCH_KEYS } },
  })

  console.log(`Found ${rows.length} orphan row(s) to delete:\n`)
  for (const row of rows) {
    console.log(JSON.stringify(row, null, 2))
  }

  const result = await db.branchSettings.deleteMany({
    where: { branchKey: { in: ORPHAN_BRANCH_KEYS } },
  })
  console.log(`\nDeleted ${result.count} row(s).`)

  const remaining = await db.branchSettings.findMany({ orderBy: { branchKey: 'asc' } })
  console.log(`\nRemaining BranchSettings rows (${remaining.length}):`, remaining.map(r => r.branchKey))
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())

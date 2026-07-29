/**
 * scripts/fix-ameerpet-nap-gbp-alignment.mjs
 *
 * One-off correction: Ameerpet's pincode and phone in BranchSettings were
 * stale placeholders. Owner confirmed the GBP listing is authoritative:
 *   pincode: 500038 -> 500016
 *   phone:   +91 77807 27374 -> +91 88851 66007
 *
 * Prints full before/after rows and a field-by-field diff as an audit trail.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const UPDATES = {
  ameerpet: {
    pincode: '500016',
    phone: '+91 88851 66007',
  },
}

async function main() {
  const branchKeys = Object.keys(UPDATES)

  const before = await db.branchSettings.findMany({
    where: { branchKey: { in: branchKeys } },
    orderBy: { branchKey: 'asc' },
  })
  console.log('=== BEFORE ===')
  for (const row of before) console.log(JSON.stringify(row, null, 2))

  for (const branchKey of branchKeys) {
    await db.branchSettings.update({ where: { branchKey }, data: UPDATES[branchKey] })
  }

  const after = await db.branchSettings.findMany({
    where: { branchKey: { in: branchKeys } },
    orderBy: { branchKey: 'asc' },
  })
  console.log('\n=== AFTER ===')
  for (const row of after) console.log(JSON.stringify(row, null, 2))

  console.log('\n=== DIFF (changed fields only) ===')
  for (const branchKey of branchKeys) {
    const b = before.find((r) => r.branchKey === branchKey)
    const a = after.find((r) => r.branchKey === branchKey)
    console.log(`\n${branchKey}:`)
    for (const field of Object.keys(UPDATES[branchKey])) {
      console.log(`  ${field}: ${JSON.stringify(b[field])} -> ${JSON.stringify(a[field])}`)
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())

/**
 * scripts/fix-branch-nap-gbp-alignment.mjs
 *
 * One-off correction: aligns BranchSettings NAP data with the confirmed GBP
 * listings. Dilsukhnagar's street address was stale (missing "Eastern Home"
 * / "Srinagar Colony" wording GBP uses); both branches' closing hours and
 * review counts were placeholders, not the real GBP numbers.
 *
 * Ameerpet's address, pincode, and phone are held pending owner confirmation
 * — NOT touched by this script.
 *
 * Prints full before/after rows and a field-by-field diff as an audit trail.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const UPDATES = {
  dilsukhnagar: {
    addressLine1: 'Flat No. 109, Eastern Home, C.B, Srinagar Colony, Kamala Nagar',
    workingHoursClose: '21:00',
    reviewCount: 116,
  },
  ameerpet: {
    workingHoursClose: '21:00',
    reviewCount: 80,
    aggregateRating: 4.7,
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

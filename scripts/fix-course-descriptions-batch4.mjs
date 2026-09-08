// scripts/fix-course-descriptions-batch4.mjs
//
// One-off content fix for 21 Course.description rows (batch4).
// All courses: partial edits — replace specific FIND substrings, leave the
//   rest of the description byte-identical.
//
// Safety:
//   - Each course is looked up by slug; if zero or more than one row match,
//     it is skipped and logged as an error (never guesses which row to touch).
//   - Before writing, the CURRENT description is re-checked against the
//     expected FIND text / opening line. If it has already changed or
//     drifted, the course is skipped — never written blind.
//   - Courses are processed sequentially. Each update is wrapped in its own
//     try/catch so one failure does not abort the rest.
//   - Safe to run twice: on the second run every course fails its
//     pre-write assertion (text no longer matches) and is skipped.
//
// Usage (production DB — @prisma/client auto-loads root .env by default):
//   npx dotenv-cli -e .env -- node scripts/fix-course-descriptions-batch4.mjs
//
// Usage (local/dev DB instead):
//   npx dotenv-cli -e .env.development.local -- node scripts/fix-course-descriptions-batch4.mjs

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

function truncate(str, n = 200) {
  if (str == null) return '(null)'
  return str.length > n ? `${str.slice(0, n)}…[+${str.length - n} more chars]` : str
}

const EDITS = [
  {
    slug: 'google-cloud-engineer-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'crucial skills that Hyderabad companies like Amazon and HCL in Gachibowli are actively hiring for.',
        replace: 'crucial skills that employers across Gachibowli and HITEC City are actively hiring for.',
      },
    ],
  },
  {
    slug: 'leadership-management-skills-training-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'working for a startup or a big player like Microsoft IDC in Hyderabad.',
        replace: 'working at a startup or a large IT employer in Hyderabad.',
      },
    ],
  },
  {
    slug: 'linux-shell-scripting-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like TCS and Wipro in Gachibowli are always looking for professionals',
        replace: 'Employers across Gachibowli and HITEC City are always looking for professionals',
      },
      {
        find: 'kicks off on the next available batch — enquire for the date',
        replace: 'kicks off soon — enquire for the date',
      },
    ],
  },
  {
    slug: 'manual-testing-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like TCS and Wipro in HITEC City are always on the lookout',
        replace: 'Employers across HITEC City and Gachibowli are always on the lookout',
      },
    ],
  },
  {
    slug: 'mern-stack-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like TCS and Wipro in Gachibowli are constantly looking for skilled full-stack talent.',
        replace: 'Employers across Gachibowli and HITEC City are constantly looking for skilled full-stack talent.',
      },
    ],
  },
  {
    slug: 'multi-cloud-architecture-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Many of our students have found great careers at TCS, Infosys, Wipro, and Cognizant, thanks to our industry-aligned curriculum and placement support.',
        replace: 'Our industry-aligned curriculum and placement support prepare you for multi-cloud roles across Hyderabad\'s IT sector.',
      },
    ],
  },
  {
    slug: 'power-bi-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'will find companies like Tech Mahindra and Cognizant hiring actively in Madhapur and Gachibowli.',
        replace: 'will find employers hiring actively across Madhapur and Gachibowli.',
      },
      {
        find: 'Our next batch starts the next available batch — enquire for the date.',
        replace: 'Our next batch starts soon — enquire for the date.',
      },
    ],
  },
  {
    slug: 'python-data-analysis-training-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like Amazon and Microsoft IDC in HITEC City are always on the lookout',
        replace: 'Employers across HITEC City and Gachibowli are always on the lookout',
      },
    ],
  },
  {
    slug: 'quantum-computing-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Organizations like TCS Research, IIT Hyderabad, IBM India, and Microsoft Research India are actively building quantum capability right now.',
        replace: 'Research institutions and large technology organisations in India are actively building quantum capability right now.',
      },
    ],
  },
  {
    slug: 'salesforce-admin-developer-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'and companies across Hyderabad — think TCS, Wipro, Amazon in Gachibowli — are constantly hiring skilled Salesforce professionals.',
        replace: 'and employers across Hyderabad are constantly hiring skilled Salesforce professionals.',
      },
    ],
  },
  {
    slug: 'sap-fico-training-institute-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like TCS, Infosys, and Wipro in Gachibowli are constantly looking for skilled SAP FICO professionals.',
        replace: 'Employers across Gachibowli and HITEC City are constantly looking for skilled SAP FICO professionals.',
      },
    ],
  },
  {
    slug: 'sap-mm-sd-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like TCS, Infosys, and Wipro in Gachibowli are constantly looking for skilled SAP consultants.',
        replace: 'Employers across Gachibowli and HITEC City are constantly looking for skilled SAP consultants.',
      },
    ],
  },
  {
    slug: 'selenium-automation-testing-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Every major company in Hyderabad, from Amazon to Wipro, is screaming for skilled Selenium automation testers.',
        replace: 'Employers across Hyderabad are screaming for skilled Selenium automation testers.',
      },
      {
        find: 'ready to crack interviews at companies like TCS and Infosys in Gachibowli.',
        replace: 'ready to crack interviews with employers across Gachibowli.',
      },
    ],
  },
  {
    slug: 'servicenow-itsm-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like Infosys and Tech Mahindra in Gachibowli are constantly looking for skilled ServiceNow professionals.',
        replace: 'Employers across Gachibowli and HITEC City are constantly looking for skilled ServiceNow professionals.',
      },
      {
        find: 'The next batch starts the next available batch — enquire for the date.',
        replace: 'The next batch starts soon — enquire for the date.',
      },
    ],
  },
  {
    slug: 'servicenow-training-institute-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'to excel in these high-growth positions and join companies like TCS, Infosys, and others.',
        replace: 'to excel in these high-growth positions.',
      },
    ],
  },
  {
    slug: 'snowflake-data-warehousing-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'is in demand, especially at companies like Wipro and Infosys in Gachibowli.',
        replace: 'is in demand, especially across Gachibowli and HITEC City.',
      },
    ],
  },
  {
    slug: 'software-testing-training-institute-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'With 15+ years of experience and a strong placement record at companies like TCS and Wipro, Coss Cloud Solutions helps you tap into the thriving IT job market',
        replace: 'With 15+ years of training experience, Coss Cloud Solutions helps you tap into the thriving IT job market',
      },
    ],
  },
  {
    slug: 'sql-data-analytics-training-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Because companies like Amazon Hyderabad and Wipro in Gachibowli are constantly looking for folks',
        replace: 'Because employers across Gachibowli and HITEC City are constantly looking for folks',
      },
    ],
  },
  {
    slug: 'tableau-data-visualization-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like Amazon Hyderabad, Wipro, and Cyient in Gachibowli are constantly hiring.',
        replace: 'Employers across Gachibowli and HITEC City are constantly hiring.',
      },
      {
        find: 'starts on the next available batch — enquire for the date',
        replace: 'starts soon — enquire for the date',
      },
    ],
  },
  {
    slug: 'terraform-ansible-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like TCS and Wipro in HITEC City are actively hiring DevOps engineers',
        replace: 'Employers across HITEC City and Gachibowli are actively hiring DevOps engineers',
      },
      {
        find: 'Our next batch starts on the next available batch — enquire for the date.',
        replace: 'Our next batch starts soon — enquire for the date.',
      },
    ],
  },
  {
    slug: 'ui-ux-design-training-institute-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'Companies like TCS and Wipro in Gachibowli are constantly looking for talented designers.',
        replace: 'Employers across Gachibowli and HITEC City are constantly looking for talented designers.',
      },
    ],
  },
]

function buildCandidateDescription(edit, oldDescription) {
  if (edit.kind === 'partial') {
    let next = oldDescription
    for (const { find, replace } of edit.replacements) {
      next = next.split(find).join(replace)
    }
    return next
  }
  return edit.newDescription
}

function assertionPasses(edit, oldDescription) {
  if (edit.kind === 'partial') {
    return edit.replacements.every(({ find }) => oldDescription.includes(find))
  }
  return oldDescription.startsWith(edit.startsWith)
}

async function processEdit(edit, summary) {
  const { slug } = edit

  const rows = await db.course.findMany({ where: { slug } })

  if (rows.length !== 1) {
    console.log(`\n[${slug}] LOOKUP: ${rows.length} row(s) matched — expected exactly 1. Skipping.`)
    summary.errored.push(`${slug}: expected 1 row by slug, found ${rows.length}`)
    return
  }

  const course = rows[0]
  const oldDescription = course.description
  const newDescription = buildCandidateDescription(edit, oldDescription)

  console.log(`\n[${slug}] LOOKUP: matched 1 row (id=${course.id})`)
  console.log(`[${slug}] OLD (first 200 chars): ${truncate(oldDescription)}`)
  console.log(`[${slug}] NEW (first 200 chars): ${truncate(newDescription)}`)

  if (!assertionPasses(edit, oldDescription)) {
    console.log(`[${slug}] SKIPPED: already changed or drifted — skipped`)
    summary.skipped.push(slug)
    return
  }

  try {
    await db.course.update({
      where: { id: course.id },
      data: { description: newDescription },
    })
    console.log(`[${slug}] UPDATED.`)
    summary.updated.push(slug)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(`[${slug}] ERROR during update: ${msg}`)
    summary.errored.push(`${slug}: ${msg}`)
  }
}

async function main() {
  console.log('\n=== COSS Course Description Fix — batch4 ===')

  const summary = { updated: [], skipped: [], errored: [] }

  for (const edit of EDITS) {
    try {
      await processEdit(edit, summary)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`\n[${edit.slug}] ERROR (unexpected, lookup/processing failed): ${msg}`)
      summary.errored.push(`${edit.slug}: ${msg}`)
    }
  }

  console.log('\n─────────────────────────────────────────────')
  console.log('SUMMARY')
  console.log(`  Updated: ${summary.updated.length}${summary.updated.length ? ' — ' + summary.updated.join(', ') : ''}`)
  console.log(`  Skipped: ${summary.skipped.length}${summary.skipped.length ? ' — ' + summary.skipped.join(', ') : ''}`)
  console.log(`  Errored: ${summary.errored.length}`)
  for (const e of summary.errored) console.log(`    - ${e}`)
  console.log('')

  await db.$disconnect()
}

main().catch(async (err) => {
  console.error('\nFatal error:', err)
  await db.$disconnect()
  process.exit(1)
})

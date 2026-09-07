// scripts/fix-course-descriptions-batch1.mjs
//
// One-off content fix for 5 Course.description rows (batch1).
// Courses 1-3: partial edits — replace specific FIND substrings, leave the
//   rest of the description byte-identical.
// Courses 4-5: full replacements of the entire description field.
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
//   npx dotenv-cli -e .env -- node scripts/fix-course-descriptions-batch1.mjs
//
// Usage (local/dev DB instead):
//   npx dotenv-cli -e .env.development.local -- node scripts/fix-course-descriptions-batch1.mjs

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

function truncate(str, n = 200) {
  if (str == null) return '(null)'
  return str.length > n ? `${str.slice(0, n)}…[+${str.length - n} more chars]` : str
}

const EDITS = [
  {
    slug: 'ai-foundation-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: "Want to work at places like Amazon Hyderabad or Microsoft IDC in Gachibowli? This foundation is crucial. Freshers in Hyderabad with these skills can expect starting salaries from ₹4.5 LPA to ₹7.5 LPA. We've seen hundreds of our students land their first AI roles. Plus, we offer flexible weekday and weekend batches at both our Dilsukhnagar and Ameerpet centers. Ready to build your future in AI?",
        replace: "Hyderabad's AI and machine learning job market is growing fast, particularly across Gachibowli and HITEC City, and this foundation is where those roles start. You'll finish with 8 real-world projects you can show in interviews. We offer flexible weekday and weekend batches at both our Dilsukhnagar and Ameerpet centres. Ready to build your future in AI?",
      },
    ],
  },
  {
    slug: 'hr-management-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: 'how companies like Infosys at Madhapur structure their HR team',
        replace: 'how IT companies in Hyderabad structure their HR teams',
      },
      {
        find: 'Join hundreds of COSS students who launched their HR careers from exactly this course.',
        replace: 'This is one of the most popular courses at our Dilsukhnagar and Ameerpet centres.',
      },
    ],
  },
  {
    slug: 'hr-recruitment-training-in-hyderabad',
    kind: 'partial',
    replacements: [
      {
        find: "building Boolean search strings that Cognizant's Hyderabad talent team would actually use",
        replace: 'building Boolean search strings that a Hyderabad IT talent team would actually use',
      },
      {
        find: 'Companies like TCS and Wipro at Gachibowli hire Recruitment Coordinators.',
        replace: 'IT companies across Gachibowli and HITEC City hire Recruitment Coordinators.',
      },
      {
        find: 'New batches run regularly — enquire for the next available date. Hundreds of students placed in the last 12 months.',
        replace: 'New batches run regularly — enquire for the next available date.',
      },
    ],
  },
  {
    slug: 'interview-preparation-training-in-hyderabad',
    kind: 'full',
    startsWith: 'Ready to land your dream job?',
    newDescription: "Our Interview Preparation Training at Coss Cloud Solutions helps you master the skills recruiters look for. We cover everything from building a strong resume to handling technical and HR rounds. You'll practise for roles like Software Engineer, Data Analyst and System Administrator through mock interviews and structured feedback. Practical sessions throughout, at our Dilsukhnagar and Ameerpet centres. Get career-ready with us.",
  },
  {
    slug: 'resume-building-career-guidance-in-hyderabad',
    kind: 'full',
    startsWith: 'Ready to land your dream job?',
    newDescription: "Our Resume Building & Career Guidance course at Coss Cloud Solutions helps you craft an ATS-friendly resume and prepare for interviews with confidence. Learn to showcase your strengths, target the right job roles, and navigate Hyderabad's competitive job market. You'll leave with a finished resume, a LinkedIn profile that works, and a clear plan for your job search. Expert guidance at our Dilsukhnagar and Ameerpet centres.",
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
  console.log('\n=== COSS Course Description Fix — batch1 ===')

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

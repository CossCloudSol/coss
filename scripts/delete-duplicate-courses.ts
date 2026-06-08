import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const DUPLICATE_SLUGS = [
  'tableau-data-visualization-training-in-hyderabad-2',
  'sql-data-analytics-training-hyderabad-2',
  'python-data-analysis-training-hyderabad-2',
  'azure-data-factory-training-in-hyderabad-2',
  'snowflake-data-warehousing-training-in-hyderabad-2',
  'servicenow-itsm-training-in-hyderabad-2',
  'graphic-design-adobe-suite-training-hyderabad-2',
]

async function main() {
  console.log('Deleting duplicate -2 slug courses...')

  for (const slug of DUPLICATE_SLUGS) {
    const course = await prisma.course.findUnique({ where: { slug } })
    if (course) {
      await prisma.course.delete({ where: { slug } })
      console.log(`✅ Deleted: ${slug} (id: ${course.id})`)
    } else {
      console.log(`⚠️  Not found: ${slug}`)
    }
  }

  console.log('\n✅ Cleanup complete.')
  console.log('Remaining drafts should now have clean unique slugs.')
}

main().catch(console.error).finally(() => prisma.$disconnect())

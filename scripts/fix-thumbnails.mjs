import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function fix() {
  console.log('Clearing dead WordPress thumbnail URLs...')

  const result = await db.course.updateMany({
    where: {
      thumbnail: {
        contains: 'nextjs.cosscloudsol.com'
      }
    },
    data: {
      thumbnail: null
    }
  })

  console.log(`✓ Cleared ${result.count} dead course thumbnail URLs`)

  const blogResult = await db.blogPost.updateMany({
    where: {
      thumbnail: {
        contains: 'nextjs.cosscloudsol.com'
      }
    },
    data: {
      thumbnail: null
    }
  })

  console.log(`✓ Cleared ${blogResult.count} dead blog thumbnail URLs`)

  const noThumb = await db.course.count({ where: { thumbnail: null } })
  console.log(`\n${noThumb} courses now have no thumbnail (will show colored fallback)`)
  console.log('Upload real thumbnails via admin panel → /admin/courses/[id]/edit')

  await db.$disconnect()
}

fix().catch(e => { console.error(e); process.exit(1) })

import { PrismaClient } from '@prisma/client'
import { getAllPosts } from '../src/lib/posts'
import { getPublishedCoursesForMatching } from '../src/lib/course-queries'
import { matchPostToCallout, type CalloutPostInput } from '../src/lib/blog-course-callout'

const prisma = new PrismaClient()

function tagToString(value: unknown): string {
  if (typeof value === 'string') return value === '[object Object]' ? '' : value
  return ''
}

async function main() {
  const coursePool = await getPublishedCoursesForMatching()

  const dbPosts = await prisma.blogPost.findMany({ where: { status: 'published' } })
  const mdxPosts = await getAllPosts()

  const rows: { slug: string; source: 'db' | 'mdx'; target: string }[] = []

  for (const p of dbPosts) {
    const input: CalloutPostInput = {
      slug: p.slug,
      title: p.title,
      tags: p.tags,
      categories: p.category ? [p.category] : [],
    }
    const target = matchPostToCallout(input, coursePool)
    rows.push({ slug: p.slug, source: 'db', target: target ? `[${target.kind}] ${target.href}` : 'NONE' })
  }

  for (const p of mdxPosts) {
    const input: CalloutPostInput = {
      slug: p.slug,
      title: p.frontmatter.title,
      tags: Array.isArray(p.frontmatter.tags) ? p.frontmatter.tags.map(tagToString).filter(Boolean) : [],
      categories: Array.isArray(p.frontmatter.categories) ? p.frontmatter.categories.map(tagToString).filter(Boolean) : [],
    }
    const target = matchPostToCallout(input, coursePool)
    rows.push({ slug: p.slug, source: 'mdx', target: target ? `[${target.kind}] ${target.href}` : 'NONE' })
  }

  rows.sort((a, b) => (a.slug < b.slug ? -1 : 1))

  const noneCount = rows.filter((r) => r.target === 'NONE').length
  const flatCount = rows.filter((r) => r.target.startsWith('[flat]')).length
  const courseCount = rows.filter((r) => r.target.startsWith('[course]')).length

  console.log(`Total posts: ${rows.length} (db: ${dbPosts.length}, mdx: ${mdxPosts.length})`)
  console.log(`Matched: flat=${flatCount} course=${courseCount} none=${noneCount}`)
  console.log('')
  console.log('slug'.padEnd(70) + 'source'.padEnd(8) + 'target')
  console.log('-'.repeat(140))
  for (const r of rows) {
    console.log(r.slug.padEnd(70) + r.source.padEnd(8) + r.target)
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding content blocks...\n')

  // ── FAQ blocks (from LandingPageTemplate faqItems) ──
  const faqItems = [
    { q: 'Who can join this course?', a: 'This course is open to graduates, working professionals, and career changers. Basic computer knowledge is sufficient for most batches.' },
    { q: 'Do you provide placement support after training?', a: 'Yes. Coss Cloud Solutions provides 100% placement assistance including resume building, LinkedIn optimization, mock interviews, and job referrals to our partner companies in Hyderabad.' },
    { q: 'Is the course available online and offline in Hyderabad?', a: 'Yes. We offer both classroom training at our Dilsukhnagar and Ameerpet centres, and live online training. Students can switch between modes as needed.' },
    { q: 'What is the batch size for each training program?', a: 'We maintain small batch sizes of 10–15 students to ensure personalised attention and hands-on practice time for every student.' },
    { q: 'Do you provide study materials and recorded sessions?', a: 'Yes. All students receive comprehensive study materials, recorded class sessions, and access to our student portal for the full duration of the course.' },
  ]

  for (let i = 0; i < faqItems.length; i++) {
    const item = faqItems[i]
    const existing = await prisma.contentBlock.findFirst({
      where: { blockType: 'faq', title: item.q }
    })
    if (existing) { console.log(`  ⏭ FAQ: ${item.q.slice(0, 40)}...`); continue }
    await prisma.contentBlock.create({
      data: {
        blockType: 'faq',
        page: 'global',
        title: item.q,
        body: item.a,
        isVisible: true,
        sortOrder: i + 1,
      }
    })
    console.log(`  ✓ FAQ: ${item.q.slice(0, 40)}...`)
  }

  // ── Timeline blocks (from about-us/page.tsx milestones) ──
  const milestones = [
    { year: '2010', event: 'Founded in Dilsukhnagar, Hyderabad with a mission to make quality IT education accessible.' },
    { year: '2016', event: 'Opened the Ameerpet branch to serve more students across Hyderabad.' },
    { year: '2018', event: 'Crossed 1,000 students placed milestone. Launched Cloud Computing programs.' },
    { year: '2020', event: 'Launched online training platform to serve students across India during COVID-19.' },
    { year: '2022', event: 'Introduced AI, Machine Learning and Data Science programs. 3,000+ students milestone.' },
    { year: '2024', event: 'Expanded to 30+ courses. 5,000+ students trained, 50+ hiring partners.' },
  ]

  for (let i = 0; i < milestones.length; i++) {
    const m = milestones[i]
    const existing = await prisma.contentBlock.findFirst({
      where: { blockType: 'timeline', title: m.year }
    })
    if (existing) { console.log(`  ⏭ Timeline: ${m.year}`); continue }
    await prisma.contentBlock.create({
      data: {
        blockType: 'timeline',
        page: 'about',
        title: m.year,
        body: m.event,
        isVisible: true,
        sortOrder: i + 1,
      }
    })
    console.log(`  ✓ Timeline: ${m.year}`)
  }

  // ── Features blocks (from page.tsx CORP_FEATURES) ──
  const features = [
    { icon: 'users', title: 'Highly caliber and experienced faculty' },
    { icon: 'building', title: 'Special batches for Hyderabad corporate clients' },
    { icon: 'award', title: 'Certified instructor-led training' },
    { icon: 'clock', title: 'Classes at flexible timings' },
    { icon: 'settings', title: 'Customized approach, weekend workshops on advanced technologies' },
    { icon: 'message-square', title: 'Informed by in-depth needs analysis and focus-group discussion' },
  ]

  for (let i = 0; i < features.length; i++) {
    const f = features[i]
    const existing = await prisma.contentBlock.findFirst({
      where: { blockType: 'feature', title: f.title }
    })
    if (existing) { console.log(`  ⏭ Feature: ${f.title.slice(0, 40)}`); continue }
    await prisma.contentBlock.create({
      data: {
        blockType: 'feature',
        page: 'home',
        title: f.title,
        icon: f.icon,
        isVisible: true,
        sortOrder: i + 1,
      }
    })
    console.log(`  ✓ Feature: ${f.title.slice(0, 40)}`)
  }

  // ── Course grid block ──
  const existingCourseGrid = await prisma.contentBlock.findFirst({
    where: { blockType: 'course-grid', page: 'home' }
  })
  if (!existingCourseGrid) {
    await prisma.contentBlock.create({
      data: {
        blockType: 'course-grid',
        page: 'home',
        title: 'Featured courses',
        body: 'Explore our most popular IT training programs',
        gridStyle: 'card-stack',
        isVisible: true,
        sortOrder: 1,
        metadata: { limit: 6, category: 'all', showPrice: true, showEnrollCount: true },
      }
    })
    console.log('  ✓ Course grid block')
  } else {
    console.log('  ⏭ Course grid block')
  }

  // ── Blog grid block ──
  const existingBlogGrid = await prisma.contentBlock.findFirst({
    where: { blockType: 'blog-grid', page: 'home' }
  })
  if (!existingBlogGrid) {
    await prisma.contentBlock.create({
      data: {
        blockType: 'blog-grid',
        page: 'home',
        title: 'Latest from our blog',
        body: 'Tips, guides, and industry insights for IT professionals',
        gridStyle: 'card-stack',
        isVisible: true,
        sortOrder: 2,
        metadata: { limit: 3, showAuthor: true, showReadTime: true },
      }
    })
    console.log('  ✓ Blog grid block')
  } else {
    console.log('  ⏭ Blog grid block')
  }

  console.log('\nDone.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

import { prisma } from '@/lib/db'
import { COURSE_GROUPS, CATEGORY_ACCENTS, CATEGORY_ICONS } from '@/lib/course-groups'
import CoursesTabPage from '@/components/CoursesTabPage'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'All IT Courses in Hyderabad | Coss Cloud Solutions',
  description:
    'Browse 84+ IT training courses in Hyderabad across Cloud, DevOps, Data Science, Programming, ERP and more. Classroom training at Dilsukhnagar & Ameerpet.',
}

export default async function CoursesPage() {
  const categories = await prisma.courseCategory.findMany({
    where: { status: 'published' },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: { select: { courses: { where: { status: 'published' } } } },
    },
  })

  const categoryMap = Object.fromEntries(
    categories.map(c => [
      c.slug,
      {
        ...c,
        courseCount: c._count?.courses ?? 0,
        accent: CATEGORY_ACCENTS[c.slug] ?? 'linear-gradient(90deg,#f97316,#fb923c)',
        icon: CATEGORY_ICONS[c.slug] ?? '📚',
      },
    ])
  )

  const groups = COURSE_GROUPS.map(group => ({
    ...group,
    categories: group.slugs
      .map(slug => categoryMap[slug])
      .filter((c): c is NonNullable<typeof c> => c != null),
    totalCourses: group.slugs.reduce(
      (sum, slug) => sum + (categoryMap[slug]?.courseCount ?? 0),
      0
    ),
  }))

  const totalCourses = categories.reduce(
    (sum, c) => sum + (c._count?.courses ?? 0),
    0
  )
  const totalCategories = categories.length

  return (
    <CoursesTabPage
      groups={groups}
      allCategories={Object.values(categoryMap)}
      totalCourses={totalCourses}
      totalCategories={totalCategories}
    />
  )
}

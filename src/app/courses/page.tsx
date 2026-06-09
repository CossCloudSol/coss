import { prisma } from '@/lib/db'
import { COURSE_GROUPS, CATEGORY_ACCENTS, CATEGORY_ICONS } from '@/lib/course-groups'
import { getCourseUrl } from '@/lib/course-url'
import CoursesTabPage from '@/components/CoursesTabPage'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'All IT Courses in Hyderabad | Coss Cloud Solutions',
  description:
    'Browse 84+ IT training courses in Hyderabad across Cloud, DevOps, Data Science, Programming, ERP and more. Classroom training at Dilsukhnagar & Ameerpet.',
}

export default async function CoursesPage() {
  const categoriesWithCourses = await prisma.courseCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      courses: {
        where: { status: 'published' },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          title: true,
          slug: true,
          urlType: true,
          duration: true,
          mode: true,
          level: true,
          price: true,
          originalPrice: true,
          badge: true,
          categorySlug: true,
        },
      },
    },
  })

  const categoryMap = Object.fromEntries(
    categoriesWithCourses.map(cat => [
      cat.slug,
      {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        accent: CATEGORY_ACCENTS[cat.slug] ?? 'linear-gradient(90deg,#f97316,#fb923c)',
        icon: CATEGORY_ICONS[cat.slug] ?? '📚',
        courses: cat.courses.map(c => ({
          ...c,
          url: getCourseUrl(c),
          formattedPrice: c.price
            ? new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              }).format(c.price)
            : null,
        })),
        courseCount: cat.courses.length,
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

  const totalCourses = categoriesWithCourses.reduce(
    (sum, c) => sum + c.courses.length,
    0
  )

  return (
    <CoursesTabPage
      groups={groups}
      totalCourses={totalCourses}
      totalCategories={categoriesWithCourses.length}
    />
  )
}

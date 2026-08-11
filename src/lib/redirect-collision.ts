import { prisma } from '@/lib/db'
import { getCourseUrl } from '@/lib/course-url'

export interface RedirectCollision {
  path: string
  redirectId: string
  destination: string
}

// Checks whether a course's computed public URL collides with an active
// redirect source. Called before allowing a course to transition to
// 'published' so an admin doesn't publish a page that a redirect will
// intercept.
export async function checkPublishRedirectCollision(course: {
  id: string
  slug: string
  urlType: string
  categorySlug?: string | null
}): Promise<RedirectCollision | null> {
  const path = getCourseUrl(course)

  const redirect = await prisma.redirect.findFirst({
    where: { source: path, isActive: true },
  })

  if (!redirect) return null

  console.warn(
    `[publish-gate] Course ${course.id} (slug: ${course.slug}) computed URL "${path}" collides with active redirect ${redirect.id} -> ${redirect.destination}`
  )

  return { path, redirectId: redirect.id, destination: redirect.destination }
}

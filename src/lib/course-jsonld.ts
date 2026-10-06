import 'server-only'
import { findBatches } from '@/lib/batch-queries'
import { getAllBranchSettings } from '@/lib/get-branch-settings'
import { BRAND_NAME } from '@/lib/nap'
import {
  SITE_URL, breadcrumbList, courseNode, faqPage, jsonLdGraph,
  type CentrePlace, type Crumb, type Faq, type JsonLdNode,
} from '@/lib/structured-data'

/** Centres for CourseInstance locations, keyed like Batch.centre ("Dilsukhnagar" → "dilsukhnagar"). */
export async function courseCentres(): Promise<Record<string, CentrePlace>> {
  const branches = await getAllBranchSettings()
  return Object.fromEntries(
    branches.map((b) => {
      const area = b.branchKey.charAt(0).toUpperCase() + b.branchKey.slice(1)
      return [b.branchKey, {
        name: `${BRAND_NAME} — ${area}`,
        streetAddress: [b.addressLine1, b.addressLine2].filter(Boolean).join(', '),
        addressLocality: b.city,
        addressRegion: b.state,
        postalCode: b.pincode,
      }]
    }),
  )
}

const plain = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

/**
 * The one Course graph for every page that shows a course (flat landing page,
 * /courses/<slug>, /courses/<cat>/<slug>): Course (+ its DB batches), the
 * visible FAQs and the breadcrumb trail. `url` is the course's canonical URL,
 * so every URL of a course describes the same entity.
 */
export async function courseJsonLd(
  course: { id: string; title: string; excerpt?: string | null; description?: string | null; price?: number | null; duration?: string | null },
  opts: { url: string; category?: { name: string; slug: string } | null; faqs?: ReadonlyArray<Faq> },
): Promise<JsonLdNode | null> {
  const [batches, centres] = await Promise.all([findBatches({ courseId: course.id }), courseCentres()])
  const crumbs: Crumb[] = [
    { name: 'Home', url: SITE_URL },
    { name: 'Courses', url: `${SITE_URL}/courses` },
    ...(opts.category ? [{ name: opts.category.name, url: `${SITE_URL}/courses/${opts.category.slug}` }] : []),
    { name: course.title, url: opts.url },
  ]
  return jsonLdGraph([
    courseNode({
      url: opts.url,
      name: course.title,
      description: plain(course.excerpt || course.description || course.title),
      price: course.price,
      duration: course.duration,
      batches,
      centres,
    }),
    faqPage(opts.url, opts.faqs ?? []),
    breadcrumbList(opts.url, crumbs),
  ])
}

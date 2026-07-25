// Single source of truth for flat-legacy landing page URLs
// (e.g. /aws-training-institute-in-hyderabad). Used by the flat-legacy
// sibling strip and the blog-to-course callout.
export function getFlatCourseUrl(flatSlug: string): string {
  return `/${flatSlug}`
}

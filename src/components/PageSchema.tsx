import { getPageSchemaMarkup } from '@/lib/get-page-seo'
import { safeJsonLd } from '@/lib/safe-json-ld'

/**
 * A static page's stored PageSeo.schemaMarkup, rendered only when something
 * survives filterSeedSchema() (valid JSON, no #organization redeclared, nothing
 * a builder already emits, no ratings). Renders nothing otherwise.
 */
export default async function PageSchema({ slug }: { slug: string }) {
  const schema = await getPageSchemaMarkup(slug)
  return schema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} /> : null
}

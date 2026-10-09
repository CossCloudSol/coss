import type { MetadataRoute } from 'next';

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

/**
 * AI search and assistant crawlers are welcome on every public page (item 12): being read
 * by them is how the institute shows up in AI answers. A bot named in its own group
 * ignores the '*' group, so each one repeats the same admin/API block.
 */
export const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot'] as const;

const PRIVATE = ['/admin/', '/api/'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // All crawlers: index public pages, block admin + API routes
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      { userAgent: [...AI_CRAWLERS], allow: '/', disallow: PRIVATE },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}

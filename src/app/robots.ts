import type { MetadataRoute } from 'next';

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // All crawlers: index public pages, block admin + API routes
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        // Prevent GPTBot (ChatGPT) from scraping without permission
        userAgent: 'GPTBot',
        disallow: ['/admin/', '/api/'],
      },
      {
        // Prevent CCBot (Common Crawl / AI training data) from admin/api
        userAgent: 'CCBot',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}

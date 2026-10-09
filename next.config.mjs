import createMDX from '@next/mdx';
import { REDIRECTS } from './redirects.config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  experimental: {
    // The sitemap route is regenerated at runtime on Vercel, in a function bundle of its own. Without
    // this its file trace has no content/posts, getAllPosts() fails there, and the 89 file-based blog
    // posts silently drop out of sitemap.xml (203 URLs became 114 on 9 Oct). Same for the home page's
    // latest-posts block, whose trace is made at build time and already includes them.
    outputFileTracingIncludes: {
      '/sitemap.xml': ['./content/posts/**/*'],
    },
  },
  images: {
    // Allowlist only the CDN hostnames actually used by <Image> components
    // (Cloudinary), to prevent this server being used as an open
    // image-optimization proxy for arbitrary external URLs.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dfditihuw/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    return [
      {
        // Security headers — every route, public pages included. Cache-Control
        // is deliberately NOT here: public pages are ISR pages and need Next's
        // own Cache-Control (s-maxage/stale-while-revalidate) to reach the
        // browser/CDN, not a blanket no-store. See the admin/api-scoped block
        // below for where no-store belongs.
        source: '/(.*)',
        headers: [
          // Prevents click-jacking — boosts security trust signals for Google
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Stops MIME-type sniffing — another security trust signal
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Forces HTTPS for 1 year (includeSubDomains) — helps HTTPS ranking factor
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          // Referrer policy — sends origin on cross-origin requests (helps analytics)
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions policy — restrict unneeded browser features
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Content Security Policy — blocks Flash/plugins, base-tag hijacking,
          // and unauthorized framing. script-src retains 'unsafe-inline' because
          // Next.js 14 App Router emits inline hydration scripts; a nonce-based
          // CSP would be required to remove it without breaking the app.
          // 'unsafe-eval' is added in development only for React Fast Refresh (HMR).
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://www.googletagmanager.com https://www.google-analytics.com`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://www.google-analytics.com https://stats.g.doubleclick.net",
              "font-src 'self' data:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-src https://www.google.com https://maps.google.com",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // Admin and API responses genuinely should never be cached — session
        // state and write endpoints, not ISR content. This is additive to the
        // security headers above, not a replacement for them.
        source: '/admin/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ];
  },

  async rewrites() {
    // /blog filter + pagination views → prerendered /blog/filter/[category]/[page].
    // Public URLs keep their query strings; /blog itself stays fully static.
    // BLOG_CAT must list the same names as BLOG_CATEGORIES in
    // src/app/blog/blog-index.tsx. A name missing here just falls through to
    // the plain /blog page (All posts), which is also what an unknown category did before.
    const BLOG_CAT = '(?<cat>All|Cloud Computing|DevOps|Data Science|Cyber Security|Digital Marketing|Linux|Programming)';
    const BLOG_PAGE = '(?<page>\\d{1,3})';
    return {
      beforeFiles: [
        {
          source: '/blog',
          has: [{ type: 'query', key: 'category', value: BLOG_CAT }, { type: 'query', key: 'page', value: BLOG_PAGE }],
          destination: '/blog/filter/:cat/:page',
        },
        {
          source: '/blog',
          has: [{ type: 'query', key: 'category', value: BLOG_CAT }],
          missing: [{ type: 'query', key: 'page' }],
          destination: '/blog/filter/:cat/1',
        },
        {
          source: '/blog',
          has: [{ type: 'query', key: 'page', value: BLOG_PAGE }],
          missing: [{ type: 'query', key: 'category' }],
          destination: '/blog/filter/All/:page',
        },
      ],
    };
  },

  async redirects() {
    return REDIRECTS;
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);

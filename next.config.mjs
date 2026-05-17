import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  images: {
    // Allowlist only the CDN hostnames actually used by <Image> components.
    // No Next.js <Image> components are currently used (WpImg uses plain <img>),
    // so restrict to Cloudinary to prevent this server being used as an open
    // image-optimization proxy for arbitrary external URLs.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },

  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    return [
      {
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
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://www.google-analytics.com https://stats.g.doubleclick.net https://fonts.googleapis.com https://fonts.gstatic.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // 301 permanent redirects for SEO-friendly URL consolidation
      { source: '/data-analytics-bi',         destination: '/courses/data-analytics-bi',    permanent: true },
      { source: '/data-analytics-bi/',        destination: '/courses/data-analytics-bi/',   permanent: true },
      { source: '/software-testing-os',       destination: '/courses/software-testing-os',  permanent: true },
      { source: '/software-testing-os/',      destination: '/courses/software-testing-os/', permanent: true },
      { source: '/courses/cyber-security-networking',             destination: '/courses/cyber-security',         permanent: true },
      { source: '/courses/cyber-security-networking/',            destination: '/courses/cyber-security/',        permanent: true },
      { source: '/courses/programming-full-stack-development',    destination: '/courses/programming-full-stack', permanent: true },
      { source: '/courses/programming-full-stack-development/',   destination: '/courses/programming-full-stack/', permanent: true },
      // Redirect /blogs/ → /blog/ so both slugs land on the same canonical
      { source: '/blogs',  destination: '/blog',  permanent: true },
      { source: '/blogs/', destination: '/blog/', permanent: true },
    ];
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);

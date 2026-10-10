// Paths only vulnerability scanners and old WordPress tooling ever request (the site has no
// WordPress, PHP, ASP or CGI). The middleware answers them with a cheap 404 before they reach
// the catch-all routes, where each one would run a function, query the database for the
// course-slug variants and cache a 404 as an ISR entry (usage plan, 10 Oct 2026).
// Dependency-free (unit-tested in scripts/test/usage-plan.test.mjs). The same paths are
// listed as `matcher` entries in src/middleware.ts; the test keeps the two in step.

/** Whole path prefixes (the segment itself or anything under it). */
export const SCANNER_PREFIXES = [
  '/wp-admin',
  '/wp-content',
  '/wp-includes',
  '/wp-json',
  '/wordpress',
  '/.git',
  '/.aws',
  '/.ssh',
  '/cgi-bin',
  '/phpmyadmin',
  '/pma',
  '/vendor',
  '/WebInterface',
  '/telescope',
  '/actuator',
] as const;

/** Exact paths. */
export const SCANNER_EXACT = ['/.env', '/xmlrpc.php', '/wp-login.php', '/wp-config.php', '/server-status'] as const;

/** File extensions the site never serves. */
const SCANNER_EXTENSION = /\.(?:php|aspx?|axd|jsp|cgi)$/i;
const SCANNER_ENV = /^\/\.env(?:\.[^/]+)?$/;

export function isScannerPath(pathname: string): boolean {
  if ((SCANNER_EXACT as readonly string[]).includes(pathname)) return true;
  if (SCANNER_ENV.test(pathname)) return true;
  if (SCANNER_EXTENSION.test(pathname)) return true;
  return SCANNER_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

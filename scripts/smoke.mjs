#!/usr/bin/env node
/**
 * scripts/smoke.mjs
 *
 * Production smoke check. Walks scripts/routes.json and asserts, per route,
 * an HTTP 200 plus the presence of a non-empty <h1> in the response body.
 * A 200 alone is not a pass -- a page can return 200 with an empty shell,
 * so the <h1> check is the actual content marker.
 *
 * routes.json is derived from the live sitemap.xml (itself DB-driven), not
 * from a direct Prisma query, so this script needs no database credentials
 * and is safe to run against production without the .env targeting concerns
 * that apply to PrismaClient scripts in this repo.
 *
 * Besides the route walk, every run also checks (GET / OPTIONS only, no lead is created):
 *   - the live sitemap.xml lists at least MIN_SITEMAP_URLS URLs (a missing build trace once dropped
 *     the blog posts, 203 -> 114, while every remaining page still answered 200)
 *   - each public lead route refuses GET (405) and answers OPTIONS (204)
 *   - scanner paths (/wp-login.php, /.env, ...) are a 404 and /tag/x redirects to /blog
 *
 * --quick skips the route walk and fetches only KEY_PAGES (home, courses, blog, locations, ...)
 * plus one flat course, one blog post and one location from the sitemap. Use it after an
 * ordinary deploy; run the full walk at most weekly (usage plan, 10 Oct 2026).
 * A protected preview URL: set VERCEL_AUTOMATION_BYPASS_SECRET (sent as a header, never printed).
 *
 * Usage: node scripts/smoke.mjs [baseUrl] [--quick] [--concurrency N]
 * Default baseUrl: https://www.cosscloudsol.com
 * Default concurrency: 10, or 4 against localhost / 127.0.0.1 — a local
 * `next start` has a Prisma pool of 5 connections to the remote DB, so 10
 * parallel cold renders queue past the timeout (P2024) and fail falsely.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const quickAt = args.indexOf('--quick');
const QUICK = quickAt !== -1;
if (QUICK) args.splice(quickAt, 1);
const flagAt =args.findIndex((a) => a === '--concurrency' || a.startsWith('--concurrency='));
let concurrencyArg = null;
if (flagAt !== -1) {
  const [flag] = args.splice(flagAt, 1);
  concurrencyArg = flag.includes('=') ? flag.split('=')[1] : args.splice(flagAt, 1)[0];
}
const BASE_URL = args[0] || 'https://www.cosscloudsol.com';
const IS_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i.test(BASE_URL);
const CONCURRENCY = concurrencyArg ? Number(concurrencyArg) : IS_LOCAL ? 4 : 10;
if (!Number.isInteger(CONCURRENCY) || CONCURRENCY < 1) {
  console.error(`--concurrency must be a positive integer (got "${concurrencyArg}")`);
  process.exit(2);
}
const TIMEOUT_MS = 15000;
const MIN_SITEMAP_URLS = 200;
const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const EXTRA_HEADERS = BYPASS ? { 'x-vercel-protection-bypass': BYPASS } : {};
const LEAD_ROUTES = ['/api/leads', '/api/contact', '/api/corporate-leads', '/api/call-clicks', '/api/whatsapp-clicks'];
const KEY_PAGES = ['/', '/courses', '/blog', '/locations', '/about-us', '/contact-us', '/free-demo-class'];
const SCANNER_PATHS = ['/wp-login.php', '/.env', '/wp-admin/admin-ajax.php', '/index.php'];

const routes = JSON.parse(readFileSync(join(__dirname, 'routes.json'), 'utf8'));

const H1_RE = /<h1[^>]*>\s*([\s\S]*?)\s*<\/h1>/i;

function stripTags(s) {
  return s.replace(/<[^>]+>/g, '').trim();
}

async function checkRoute(route) {
  const url = BASE_URL + route.path;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow', headers: EXTRA_HEADERS });
    clearTimeout(timeout);

    if (res.status !== 200) {
      return { route, ok: false, reason: `HTTP ${res.status}` };
    }

    const body = await res.text();
    const match = body.match(H1_RE);
    const h1Text = match ? stripTags(match[1]) : '';

    if (!h1Text) {
      return { route, ok: false, reason: 'no non-empty <h1> found (possible empty shell)' };
    }

    return { route, ok: true, h1Text };
  } catch (err) {
    return { route, ok: false, reason: err.name === 'AbortError' ? `timeout after ${TIMEOUT_MS}ms` : err.message };
  }
}

async function runPool(items, worker, concurrency) {
  const results = new Array(items.length);
  let next = 0;
  async function runner() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, runner));
  return results;
}

/** One request, redirects not followed, so a status (405, 404, 308) and a Location can be asserted. */
async function probe(path, method = 'GET') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(BASE_URL + path, { method, redirect: 'manual', signal: controller.signal, headers: EXTRA_HEADERS });
  } finally {
    clearTimeout(timeout);
  }
}

/** Sitemap size, lead routes, scanner paths, /tag redirect. Returns { problems, sitemapPaths }. */
async function checkInfrastructure() {
  const problems = [];
  let sitemapPaths = [];
  try {
    const res = await probe('/sitemap.xml');
    const xml = res.status === 200 ? await res.text() : '';
    sitemapPaths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
      try {
        return new URL(m[1]).pathname;
      } catch {
        return m[1];
      }
    });
    if (res.status !== 200) problems.push(`/sitemap.xml -- HTTP ${res.status}`);
    else if (sitemapPaths.length < MIN_SITEMAP_URLS) problems.push(`/sitemap.xml -- ${sitemapPaths.length} URLs, expected at least ${MIN_SITEMAP_URLS}`);
    else console.log(`sitemap has ${sitemapPaths.length} URLs (at least ${MIN_SITEMAP_URLS})`);
  } catch (err) {
    problems.push(`/sitemap.xml -- ${err.message}`);
  }

  for (const route of LEAD_ROUTES) {
    try {
      const g = await probe(route);
      if (g.status !== 405) problems.push(`GET ${route} -- HTTP ${g.status}, expected 405`);
      const o = await probe(route, 'OPTIONS');
      if (o.status !== 204) problems.push(`OPTIONS ${route} -- HTTP ${o.status}, expected 204`);
    } catch (err) {
      problems.push(`${route} -- ${err.message}`);
    }
  }

  for (const path of SCANNER_PATHS) {
    try {
      const res = await probe(path);
      // 404 from the middleware, or 403 where a Vercel Firewall rule denies the path before it runs
      if (![403, 404].includes(res.status)) problems.push(`${path} -- HTTP ${res.status}, expected 404 (or 403 from a Firewall rule)`);
      else if (res.status === 404 && (res.headers.get('content-type') || '').includes('text/html')) {
        problems.push(`${path} -- 404 is the full HTML page (a function run and a cached entry), not the middleware's plain 404`);
      }
    } catch (err) {
      problems.push(`${path} -- ${err.message}`);
    }
  }
  try {
    const res = await probe('/tag/aws');
    const loc = res.headers.get('location') || '';
    if (![301, 308].includes(res.status) || !/\/blog$/.test(loc)) problems.push(`/tag/aws -- HTTP ${res.status} ${loc}, expected a redirect to /blog`);
  } catch (err) {
    problems.push(`/tag/aws -- ${err.message}`);
  }
  return { problems, sitemapPaths };
}

async function main() {
  const infra = await checkInfrastructure();

  let toWalk = routes;
  if (QUICK) {
    const sm = infra.sitemapPaths;
    const flat = sm.find((p) => /^\/[^/]+$/.test(p) && /training/.test(p));
    const post = sm.find((p) => p.startsWith('/blog/') && !p.startsWith('/blog/filter'));
    const place = sm.find((p) => /^\/locations\/[^/]+$/.test(p));
    toWalk = [...KEY_PAGES, flat, post, place].filter(Boolean).map((path) => ({ path, type: 'quick' }));
  }
  console.log(`Smoke-checking ${toWalk.length} routes${QUICK ? ' (--quick)' : ''} against ${BASE_URL} (concurrency ${CONCURRENCY})\n`);

  const results = await runPool(toWalk, checkRoute, CONCURRENCY);
  const failures = results.filter((r) => !r.ok);

  for (const r of failures) {
    console.log(`FAIL ${r.route.path} [${r.route.type}] -- ${r.reason}`);
  }
  for (const p of infra.problems) console.log(`FAIL ${p}`);

  const failed = failures.length + infra.problems.length;
  console.log(`\n${results.length - failures.length}/${results.length} passed, ${failures.length} failed; ${infra.problems.length} infrastructure check(s) failed`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();

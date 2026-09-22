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
 * Usage: node scripts/smoke.mjs [baseUrl]
 * Default baseUrl: https://www.cosscloudsol.com
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.argv[2] || 'https://www.cosscloudsol.com';
const CONCURRENCY = 10;
const TIMEOUT_MS = 15000;

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
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
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

async function main() {
  console.log(`Smoke-checking ${routes.length} routes against ${BASE_URL}\n`);

  const results = await runPool(routes, checkRoute, CONCURRENCY);
  const failures = results.filter((r) => !r.ok);

  for (const r of failures) {
    console.log(`FAIL ${r.route.path} [${r.route.type}] -- ${r.reason}`);
  }

  console.log(`\n${results.length - failures.length}/${results.length} passed, ${failures.length} failed`);

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main();

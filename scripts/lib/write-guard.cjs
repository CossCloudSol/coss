/**
 * Imported first by every script that writes to the database:
 *   import './lib/write-guard.cjs';        (ESM / TypeScript)
 *   require('./lib/write-guard.cjs');      (CommonJS)
 * Runs before anything else in the script (before Prisma can load .env). It first loads
 * .env.development.local (dev-env.cjs), so scripts use the local dev DB by default, then
 * refuses to continue unless the database is the local dev DB, or production was chosen on
 * purpose for this one run: COSS_DB=prod and ALLOW_PROD_WRITE=1. Prints no URL or host.
 */
require('./dev-env.cjs');

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', 'host.docker.internal']);

function isLocalDevDatabase(url) {
  try {
    const host = new URL(url).hostname;
    return LOCAL_HOSTS.has(host) || host.endsWith('.localhost');
  } catch {
    return false;
  }
}

function checkWriteAllowed(env = process.env) {
  const url = env.DIRECT_URL || env.DATABASE_URL || '';
  if (isLocalDevDatabase(url)) return 'dev';
  if (env.ALLOW_PROD_WRITE === '1') return 'allowed';
  return 'refused';
}

const verdict = checkWriteAllowed();
const name = require('node:path').basename(process.argv[1] || 'script');
if (verdict === 'refused') {
  console.error(
    `[${name}] Refusing to write: the database is not the local dev DB.\n` +
      `  Dev:        the default (.env.development.local is loaded automatically)\n` +
      `  Production: only on purpose, with COSS_DB=prod and ALLOW_PROD_WRITE=1 set for this one run.`,
  );
  process.exit(1);
}
if (verdict === 'allowed') console.warn(`[${name}] ALLOW_PROD_WRITE=1: writing to a non-dev database.`);

module.exports = { isLocalDevDatabase, checkWriteAllowed };

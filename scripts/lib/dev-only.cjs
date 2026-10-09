/**
 * Stricter than write-guard.cjs: for scripts that must NEVER touch production (the dev seed).
 * Allows only the local dev database. ALLOW_PROD_WRITE and COSS_DB=prod do not unlock it.
 * Prints no URL or host.
 */
const { isLocalDevDatabase } = require('./write-guard.cjs');

function devOnlyVerdict(env = process.env) {
  if (env.COSS_DB === 'prod') return 'refused: COSS_DB=prod';
  const urls = [env.DATABASE_URL, env.DIRECT_URL].filter(Boolean);
  if (urls.length === 0) return 'refused: no database configured';
  if (!urls.every(isLocalDevDatabase)) return 'refused: not the local dev database';
  return 'dev';
}

function assertDevOnly(env = process.env, name = 'script') {
  const v = devOnlyVerdict(env);
  if (v !== 'dev') {
    console.error(`[${name}] ${v}. This script only ever runs against the local dev database.`);
    process.exit(1);
  }
}

module.exports = { devOnlyVerdict, assertDevOnly };

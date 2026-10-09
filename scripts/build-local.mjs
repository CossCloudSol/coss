/**
 * Local production build against the local dev database (npm run build:local).
 * `npm run build` itself is unchanged (Vercel runs it); run locally it would read the
 * production database via .env, so local builds go through this script instead.
 * A fresh VERCEL_DEPLOYMENT_ID keys the data cache, so a local build never reuses a stale
 * cache from an earlier build. Production only on purpose: COSS_DB=prod npm run build:local.
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url);
require('./lib/dev-env.cjs');

const env = { ...process.env, VERCEL_DEPLOYMENT_ID: process.env.VERCEL_DEPLOYMENT_ID || `local-${Date.now()}` };
const r = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', env, shell: process.platform === 'win32' });
process.exit(r.status ?? 1);

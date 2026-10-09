/**
 * Makes local scripts use the local dev database by default.
 *
 * Imported first by every script that uses Prisma (write-guard.cjs loads it too):
 *   import './lib/dev-env.cjs';        (ESM / TypeScript)
 *   require('./lib/dev-env.cjs');      (CommonJS)
 *
 * Why: @prisma/client loads the root .env (production) when it is imported, but dotenv never
 * overrides a variable that is already set. Loading .env.development.local into process.env
 * first therefore points DATABASE_URL / DIRECT_URL (and the rest) at the dev database.
 *
 * Production is opt-in only, for one run: COSS_DB=prod. Writes to production additionally
 * need ALLOW_PROD_WRITE=1 (see write-guard.cjs). Prints no URL, host or value.
 */
const fs = require('node:fs');
const path = require('node:path');

const DEV_ENV_FILE = '.env.development.local';

/** Minimal dotenv-format parser: KEY=VALUE lines, # comments, optional single/double quotes. */
function parseEnv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2];
    const q = v[0];
    if ((q === '"' || q === "'") && v.endsWith(q) && v.length >= 2) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, '').trim();
    if (q === '"') v = v.replace(/\\n/g, '\n');
    out[m[1]] = v;
  }
  return out;
}

/**
 * Loads the dev env file into env (never overriding a value already set).
 * Returns 'prod' (opted out), 'preset' (DATABASE_URL already set by the caller, e.g. the
 * `npx dotenv-cli -e .env.development.local --` wrapper or a test), 'dev' (loaded) or
 * 'missing' (no dev file).
 */
function loadDevEnv(env = process.env, root = process.cwd()) {
  if (env.COSS_DB === 'prod') return 'prod';
  if (env.DATABASE_URL) return 'preset';
  const file = path.join(root, DEV_ENV_FILE);
  if (!fs.existsSync(file)) return 'missing';
  const vars = parseEnv(fs.readFileSync(file, 'utf8'));
  for (const [k, v] of Object.entries(vars)) if (env[k] === undefined) env[k] = v;
  env.COSS_DB = 'dev';
  return 'dev';
}

const mode = loadDevEnv();
const name = path.basename(process.argv[1] || 'script');
if (mode === 'missing') {
  console.error(
    `[${name}] ${DEV_ENV_FILE} not found, so this script would use the production database.\n` +
      `  Create ${DEV_ENV_FILE} for the local dev DB, or run against production on purpose with COSS_DB=prod.`,
  );
  process.exit(1);
}
if (mode === 'prod') console.warn(`[${name}] COSS_DB=prod: using the production database (.env).`);

module.exports = { parseEnv, loadDevEnv, DEV_ENV_FILE };

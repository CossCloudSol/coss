/**
 * Part of the unstable_cache key for data every page's header renders (the
 * course catalogue, the top strip). Next's Data Cache survives deployments,
 * so without this a deploy would keep serving catalogue data cached before
 * it (up to the 24 h revalidate), e.g. after a data fix run in the SQL
 * editor. Keying by the deployment's commit gives each deploy fresh entries,
 * built from the database during its own build.
 */
export const DEPLOY_CACHE_KEY =
  process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || 'local';

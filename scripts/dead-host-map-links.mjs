// dead-host-map-links.mjs
// Phase 1c: map every unique non-image nextjs.cosscloudsol.com path found by
// dead-host-extract.mjs to its correct destination on www.cosscloudsol.com,
// reusing the SAME redirect table the site already serves (next.config.mjs)
// so the mapping can't drift from production behavior. Paths not covered by
// a static redirect are tested live (one gentle GET each) and the final
// resolved URL + status is recorded.
// Usage: node scripts/dead-host-map-links.mjs

import fs from "fs";
import path from "path";
import nextConfig from "../next.config.mjs";

const PROD = "https://www.cosscloudsol.com";

function stripTrailingSlash(p) {
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

function matchRedirect(pathname, redirects) {
  const normalized = stripTrailingSlash(pathname);
  for (const r of redirects) {
    if (r.has) continue; // host-based rule, not applicable (path already stripped of host)
    if (r.source.includes(":path*")) {
      const prefix = stripTrailingSlash(r.source.replace("/:path*", ""));
      if (normalized === prefix || normalized.startsWith(prefix + "/")) {
        const rest = normalized.slice(prefix.length).replace(/^\//, "");
        const destPrefix = r.destination.replace("/:path*", "");
        return rest ? `${destPrefix}/${rest}` : destPrefix || "/";
      }
    } else if (stripTrailingSlash(r.source) === normalized) {
      return r.destination;
    }
  }
  return null;
}

async function resolveLive(urlPath) {
  const url = `${PROD}${urlPath}`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    return { finalUrl: res.url, status: res.status };
  } catch (e) {
    return { error: String(e.message || e) };
  }
}

async function main() {
  const redirects = await nextConfig.redirects();

  const occ = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "dead-host-occurrences.json"), "utf8")
  );
  const linkOcc = occ.occurrences.filter((o) => !/^\/wp-content\/uploads\//.test(o.urlPath));
  const uniquePaths = [...new Set(linkOcc.map((o) => o.urlPath))];

  console.log(`Mapping ${uniquePaths.length} unique link paths...`);

  const results = [];
  for (const rawPath of uniquePaths) {
    const [pathname, query] = rawPath.split("?");
    const cleanPathname = pathname || "/";
    const redirectDest = matchRedirect(cleanPathname, redirects);

    let finalDest;
    let source;
    let liveCheck = null;

    if (cleanPathname === "/" || cleanPathname === "") {
      finalDest = `${PROD}/`;
      source = "root-homepage";
    } else if (redirectDest) {
      finalDest = redirectDest.startsWith("http") ? redirectDest : `${PROD}${redirectDest}`;
      source = "next-config-redirect";
    } else {
      liveCheck = await resolveLive(cleanPathname);
      finalDest = liveCheck.finalUrl || null;
      source = "live-test";
      await new Promise((r) => setTimeout(r, 100));
    }

    results.push({
      oldPath: rawPath,
      occurrenceCount: linkOcc.filter((o) => o.urlPath === rawPath).length,
      hadUtmParam: !!query && query.includes("utm_source"),
      mappedVia: source,
      newUrl: finalDest,
      liveCheck,
    });
  }

  fs.writeFileSync(
    path.join(process.cwd(), "dead-host-link-mapping.json"),
    JSON.stringify({ total: results.length, results }, null, 2)
  );

  console.log("Done. See dead-host-link-mapping.json");
  for (const r of results) {
    console.log(`${r.oldPath}  ->  ${r.newUrl}  [${r.mappedVia}]${r.liveCheck ? ` (status ${r.liveCheck.status})` : ""}`);
  }
}

main();

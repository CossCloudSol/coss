// dead-host-build-final-mapping.mjs
// Phase 1d: consolidate extraction + image verification + link mapping into
// one per-file replacement plan (old string -> new string), plus the 3 bare
// email occurrences the URL regex can't catch. Read-only — writes
// dead-host-final-mapping.json for Phase 2 to consume after approval.
// Usage: node scripts/dead-host-build-final-mapping.mjs

import fs from "fs";
import path from "path";

const occ = JSON.parse(fs.readFileSync("dead-host-occurrences.json", "utf8"));
const imgMap = JSON.parse(fs.readFileSync("dead-host-image-mapping.json", "utf8"));
const linkMap = JSON.parse(fs.readFileSync("dead-host-link-mapping.json", "utf8"));

const MANUAL_OVERRIDES = {
  "/courses/azure-cloud-training-center-in-hyderabad": "https://www.cosscloudsol.com/azure-training-institute-in-hyderabad",
  "/courses/digital-marketing-training-center-in-hyderabad": "https://www.cosscloudsol.com/digital-marketing-training-institute-in-hyderabad",
};

const imgByPath = new Map(imgMap.results.map((r) => [r.oldPath, r]));
const linkByPath = new Map(linkMap.results.map((r) => [r.oldPath, r]));

const fileMap = {}; // file -> [{old, new, kind, note}]

function addRepl(file, oldStr, newStr, kind, note) {
  fileMap[file] = fileMap[file] || [];
  fileMap[file].push({ old: oldStr, new: newStr, kind, note });
}

for (const o of occ.occurrences) {
  if (/^\/wp-content\/uploads\//.test(o.urlPath)) {
    const img = imgByPath.get(o.urlPath);
    if (img && img.verified) {
      addRepl(o.file, o.url, img.deliveryUrl, "image", null);
    } else {
      addRepl(o.file, o.url, null, "image-missing", `No verified Cloudinary asset for ${o.urlPath} — recommend removing the image reference (frontmatter featuredImage is also corrupt "[object Object]" on this post, so no fallback thumbnail exists).`);
    }
  } else {
    const cleanPath = o.urlPath.split("?")[0] || "/";
    let newUrl = MANUAL_OVERRIDES[cleanPath.replace(/\/$/, "")];
    if (!newUrl) {
      const link = linkByPath.get(o.urlPath);
      newUrl = link ? link.newUrl : null;
    }
    addRepl(o.file, o.url, newUrl, "link", newUrl ? null : "UNRESOLVED — needs manual review");
  }
}

// bare email occurrences (no http:// prefix, missed by the URL regex)
const EMAIL_FILES = [
  "best-azure-cloud-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution.mdx",
  "best-salesforce-institute-dilsukhnagar-hyderabad-coss-cloud-solutions.mdx",
  "devops-training-in-dilsukhnagar.mdx",
];
for (const file of EMAIL_FILES) {
  addRepl(file, "info@nextjs.cosscloudsol.com", "info@cosscloudsol.com", "email", null);
}

const totalFiles = Object.keys(fileMap).length;
const totalRepls = Object.values(fileMap).reduce((s, arr) => s + arr.length, 0);
const unresolved = Object.values(fileMap).flat().filter((r) => !r.new);

console.log(`Files touched: ${totalFiles}`);
console.log(`Total replacements: ${totalRepls}`);
console.log(`Unresolved (no new URL): ${unresolved.length}`);
if (unresolved.length) {
  console.log(JSON.stringify(unresolved, null, 2));
}

fs.writeFileSync(
  "dead-host-final-mapping.json",
  JSON.stringify({ totalFiles, totalRepls, unresolvedCount: unresolved.length, fileMap }, null, 2)
);
console.log("Wrote dead-host-final-mapping.json");

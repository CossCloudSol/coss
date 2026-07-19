// dead-host-apply.mjs
// Phase 2: apply the Phase-1-approved replacement plan
// (dead-host-final-mapping.json) to content/posts/*.mdx.
//   - image / link / email replacements: literal global string substitution
//   - image-missing: surgically remove the `![alt](URL)` markdown construct
//     (and any enclosing link-wrapper) without leaving empty artifacts, then
//     null out that post's corrupted `featuredImage: "[object Object]"`
//     frontmatter field.
// Also rewrites the 7 www.cosscloud.com (typo domain) self-links (Addition B).
//
// IMPORTANT: replacements are applied longest-`old`-string-first within each
// file. The root-homepage link ("https://nextjs.cosscloudsol.com/") is a
// literal substring of every image URL on the same host, so replacing it
// first would corrupt not-yet-processed image URLs via the global
// split/join. Processing longest-to-shortest guarantees every more-specific
// URL is consumed before any shorter one that is its prefix.
//
// Usage:
//   node scripts/dead-host-apply.mjs --dry-run   (default, prints diffs)
//   node scripts/dead-host-apply.mjs --write     (writes files to disk)

import fs from "fs";
import path from "path";

const WRITE = process.argv.includes("--write");
const POSTS_DIR = path.join(process.cwd(), "content/posts");

const finalMap = JSON.parse(fs.readFileSync("dead-host-final-mapping.json", "utf8"));
const occ = JSON.parse(fs.readFileSync("dead-host-occurrences.json", "utf8"));

const TYPO_DOMAIN_RE = /https:\/\/www\.cosscloud\.com/g;

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Strip a `![alt](URL)` construct out of a line, plus an enclosing
// `[ ... ](otherURL)` link-wrapper if present, then clean up now-empty
// markdown decoration (heading markers, bold wrappers) around it.
function removeImageConstruct(line, url) {
  const escUrl = escapeRegExp(url);
  const linkedImgRe = new RegExp(`\\[!\\[[^\\]]*\\]\\(${escUrl}\\)\\]\\([^)]*\\)`);
  if (linkedImgRe.test(line)) {
    line = line.replace(linkedImgRe, "");
  } else {
    const imgRe = new RegExp(`!\\[[^\\]]*\\]\\(${escUrl}\\)`);
    line = line.replace(imgRe, "");
  }
  line = line.replace(/^(#{1,6})\s*$/, "");
  line = line.replace(/\*\*\*\*/g, "");
  line = line.replace(/^\*\*\s*\*\*/, "");
  return line;
}

let filesChanged = 0;
let totalRepls = 0;
const report = [];

for (const [file, repls] of Object.entries(finalMap.fileMap)) {
  const filePath = path.join(POSTS_DIR, file);
  let content = fs.readFileSync(filePath, "utf8");
  const before = content;
  const fileReport = { file, changes: [] };

  // --- 1. missing-image removals FIRST (longest, most specific strings;
  // must happen before any shorter substitution that could be a prefix). ---
  const missingForFile = repls.filter((r) => r.kind === "image-missing");
  const touchedLineIdxs = new Set();
  if (missingForFile.length > 0) {
    const lines = content.split("\n");
    for (const r of missingForFile) {
      const occRow = occ.occurrences.find((o) => o.file === file && o.url === r.old);
      let idx = occRow ? occRow.line - 1 : -1;
      if (idx === -1 || !lines[idx] || !lines[idx].includes(r.old)) {
        idx = lines.findIndex((l) => l.includes(r.old));
      }
      if (idx === -1) {
        fileReport.changes.push({ warning: `image line not found for ${r.old}` });
        continue;
      }
      const lineBefore = lines[idx];
      lines[idx] = removeImageConstruct(lineBefore, r.old);
      fileReport.changes.push({ kind: "image-removed", old: r.old, lineBefore, lineAfter: lines[idx] });
      if (lines[idx].trim() === "") touchedLineIdxs.add(idx);
      totalRepls++;
    }
    content = lines.filter((l, i) => !touchedLineIdxs.has(i)).join("\n");
  }

  // --- 2. frontmatter cleanup for posts that had a missing-image removal ---
  if (missingForFile.length > 0) {
    const fmMatch = content.match(/^(---\n[\s\S]*?\n---)/);
    if (fmMatch && /featuredImage:\s*"\[object Object\]"/.test(fmMatch[1])) {
      const newFm = fmMatch[1].replace(/featuredImage:\s*"\[object Object\]"\n?/, "");
      content = content.replace(fmMatch[1], newFm);
      fileReport.changes.push({ kind: "frontmatter-cleanup", note: 'removed featuredImage: "[object Object]"' });
    }
  }

  // --- 3. resolved replacements (image / link / email), deduped by `old`,
  // longest string first so specific URLs are consumed before any shorter
  // string that is one of their prefixes (e.g. the bare root homepage link
  // vs. a full wp-content image URL on the same host). ---
  const resolved = repls.filter((r) => r.new);
  const uniqueByOld = [...new Map(resolved.map((r) => [r.old, r])).values()].sort(
    (a, b) => b.old.length - a.old.length
  );
  for (const r of uniqueByOld) {
    const occurrencesBefore = content.split(r.old).length - 1;
    if (occurrencesBefore === 0) {
      fileReport.changes.push({ warning: `old string not found: ${r.old}` });
      continue;
    }
    content = content.split(r.old).join(r.new);
    fileReport.changes.push({ kind: r.kind, old: r.old, new: r.new, count: occurrencesBefore });
    totalRepls += occurrencesBefore;
  }

  // --- 4. Addition B: typo domain www.cosscloud.com -> www.cosscloudsol.com ---
  if (TYPO_DOMAIN_RE.test(content)) {
    const count = (content.match(TYPO_DOMAIN_RE) || []).length;
    content = content.replace(TYPO_DOMAIN_RE, "https://www.cosscloudsol.com");
    fileReport.changes.push({ kind: "typo-domain-fix", count });
    totalRepls += count;
  }

  if (content !== before) {
    filesChanged++;
    report.push(fileReport);
    if (WRITE) fs.writeFileSync(filePath, content);
  }
}

// Addition B may also touch files with no other dead-host references.
const allFiles = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx"));
for (const file of allFiles) {
  if (finalMap.fileMap[file]) continue;
  const filePath = path.join(POSTS_DIR, file);
  let content = fs.readFileSync(filePath, "utf8");
  if (TYPO_DOMAIN_RE.test(content)) {
    const count = (content.match(TYPO_DOMAIN_RE) || []).length;
    content = content.replace(TYPO_DOMAIN_RE, "https://www.cosscloudsol.com");
    filesChanged++;
    totalRepls += count;
    report.push({ file, changes: [{ kind: "typo-domain-fix", count }] });
    if (WRITE) fs.writeFileSync(filePath, content);
  }
}

console.log(`Mode: ${WRITE ? "WRITE" : "DRY-RUN"}`);
console.log(`Files changed: ${filesChanged}`);
console.log(`Total replacements applied: ${totalRepls}`);

const warnings = report.flatMap((r) => r.changes.filter((c) => c.warning));
if (warnings.length) {
  console.log(`\n⚠ WARNINGS (${warnings.length}):`);
  for (const w of warnings) console.log(" -", w.warning);
} else {
  console.log("\nNo warnings.");
}

fs.writeFileSync(
  "dead-host-apply-report.json",
  JSON.stringify({ mode: WRITE ? "write" : "dry-run", filesChanged, totalRepls, report }, null, 2)
);
console.log("\nFull report: dead-host-apply-report.json");

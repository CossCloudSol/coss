// dead-host-extract.mjs
// Phase 1: extract every nextjs.cosscloudsol.com reference from content/posts/*.mdx,
// classify (image / link / text), and dump raw occurrences to JSON for the
// mapping pass. Read-only, no network calls.
// Usage: node scripts/dead-host-extract.mjs

import fs from "fs";
import path from "path";

const POSTS_DIR = path.join(process.cwd(), "content/posts");
const HOST_RE = /https?:\/\/nextjs\.cosscloudsol\.com([^\s")'<>\]]*)/g;

function classify(line, matchIndex, fullMatch) {
  const before = line.slice(0, matchIndex);
  const after = line.slice(matchIndex + fullMatch.length);

  // markdown image: ![alt](URL)
  if (/!\[[^\]]*\]\($/.test(before)) return "md-image";
  // markdown link (non-image): [text](URL)
  if (/\[[^\]]*\]\($/.test(before)) return "md-link";
  // html <img src="URL" or src='URL'
  if (/<img\b[^>]*\bsrc=["']$/i.test(before)) return "html-img";
  // html <a href="URL"
  if (/<a\b[^>]*\bhref=["']$/i.test(before)) return "html-href";
  // generic src=/href= without full tag context captured on this line
  if (/\bsrc=["']$/.test(before)) return "attr-src";
  if (/\bhref=["']$/.test(before)) return "attr-href";

  return "plain-text";
}

function main() {
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx"));
  const occurrences = [];

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    lines.forEach((line, idx) => {
      HOST_RE.lastIndex = 0;
      let m;
      while ((m = HOST_RE.exec(line)) !== null) {
        const fullUrl = m[0];
        const pathPart = m[1] || "/";
        const kind = classify(line, m.index, fullUrl);
        occurrences.push({
          file,
          line: idx + 1,
          url: fullUrl,
          urlPath: pathPart,
          kind,
          context: line.trim().slice(0, 200),
        });
      }
    });
  }

  const summary = {
    totalOccurrences: occurrences.length,
    byKind: {},
    fileCount: new Set(occurrences.map((o) => o.file)).size,
  };
  for (const o of occurrences) {
    summary.byKind[o.kind] = (summary.byKind[o.kind] || 0) + 1;
  }

  fs.writeFileSync(
    path.join(process.cwd(), "dead-host-occurrences.json"),
    JSON.stringify({ summary, occurrences }, null, 2)
  );

  console.log("Summary:", JSON.stringify(summary, null, 2));
  console.log(`Wrote ${occurrences.length} occurrences to dead-host-occurrences.json`);
}

main();

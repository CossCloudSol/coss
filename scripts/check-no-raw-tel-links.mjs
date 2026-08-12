#!/usr/bin/env node
// Fails if a raw `tel:` anchor href shows up anywhere under src/ outside the
// allowlist. Every public call link must go through <CallLink> so its click
// gets logged to /api/call-clicks — see src/components/CallLink.tsx.
//
// No .github/ workflows exist in this repo yet, so nothing runs this
// automatically. Run it by hand (or wire into CI later) with:
//   npm run check:tel-links

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC_DIR = join(process.cwd(), 'src');

// Relative to src/, forward-slash form.
const ALLOWLIST = new Set([
  'components/CallLink.tsx',
  'components/admin/LeadDrawer.tsx',
]);

const RAW_TEL_PATTERNS = [/href="tel:/, /href=\{`tel:/];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function main() {
  const files = walk(SRC_DIR);
  const violations = [];

  for (const file of files) {
    const relPath = relative(SRC_DIR, file).split('\\').join('/');
    if (ALLOWLIST.has(relPath)) continue;

    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (RAW_TEL_PATTERNS.some((re) => re.test(line))) {
        violations.push(`  src/${relPath}:${i + 1}: ${line.trim()}`);
      }
    });
  }

  if (violations.length > 0) {
    console.error('Raw tel: link(s) found outside <CallLink> — clicks on these will not be tracked:\n');
    console.error(violations.join('\n'));
    console.error('\nUse <CallLink number="..."> instead (see src/components/CallLink.tsx).');
    process.exit(1);
  }

  console.log(`OK — no raw tel: links outside the allowlist (${files.length} files scanned).`);
}

main();

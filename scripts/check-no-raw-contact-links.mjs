#!/usr/bin/env node
// Fails if a raw `tel:` or `wa.me`/WhatsApp anchor href shows up anywhere
// under src/ outside the allowlists. Every public contact link must go
// through <CallLink> or <WhatsAppLink> so its click gets logged to
// /api/call-clicks or /api/whatsapp-clicks — see src/components/CallLink.tsx
// and src/components/WhatsAppLink.tsx.
//
// No .github/ workflows exist in this repo yet, so nothing runs this
// automatically. Run it by hand (or wire into CI later) with:
//   npm run check:contact-links

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC_DIR = join(process.cwd(), 'src');

// Relative to src/, forward-slash form.
const TEL_ALLOWLIST = new Set([
  'components/CallLink.tsx',
  'components/admin/LeadDrawer.tsx',
]);

const WA_ALLOWLIST = new Set([
  'components/WhatsAppLink.tsx',
  'components/admin/LeadDrawer.tsx',
  'app/admin/whatsapp/page.tsx',
]);

const RAW_TEL_PATTERNS = [/href="tel:/, /href=\{`tel:/];
const RAW_WA_PATTERNS = [
  /href="https:\/\/wa\.me\//,
  /href=\{`https:\/\/wa\.me\//,
  /href="https:\/\/api\.whatsapp\.com\//,
  /href=\{`https:\/\/api\.whatsapp\.com\//,
  /href="https:\/\/web\.whatsapp\.com\//,
  /href=\{`https:\/\/web\.whatsapp\.com\//,
];

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
  const telViolations = [];
  const waViolations = [];

  for (const file of files) {
    const relPath = relative(SRC_DIR, file).split('\\').join('/');
    const lines = readFileSync(file, 'utf8').split('\n');

    if (!TEL_ALLOWLIST.has(relPath)) {
      lines.forEach((line, i) => {
        if (RAW_TEL_PATTERNS.some((re) => re.test(line))) {
          telViolations.push(`  src/${relPath}:${i + 1}: ${line.trim()}`);
        }
      });
    }

    if (!WA_ALLOWLIST.has(relPath)) {
      lines.forEach((line, i) => {
        if (RAW_WA_PATTERNS.some((re) => re.test(line))) {
          waViolations.push(`  src/${relPath}:${i + 1}: ${line.trim()}`);
        }
      });
    }
  }

  let failed = false;

  if (telViolations.length > 0) {
    failed = true;
    console.error('Raw tel: link(s) found outside <CallLink> — clicks on these will not be tracked:\n');
    console.error(telViolations.join('\n'));
    console.error('\nUse <CallLink number="..."> instead (see src/components/CallLink.tsx).\n');
  }

  if (waViolations.length > 0) {
    failed = true;
    console.error('Raw wa.me/WhatsApp link(s) found outside <WhatsAppLink> — clicks on these will not be tracked:\n');
    console.error(waViolations.join('\n'));
    console.error('\nUse <WhatsAppLink ctaType="..."> instead (see src/components/WhatsAppLink.tsx).\n');
  }

  if (failed) {
    process.exit(1);
  }

  console.log(`OK — no raw tel:/wa.me links outside the allowlists (${files.length} files scanned).`);
}

main();

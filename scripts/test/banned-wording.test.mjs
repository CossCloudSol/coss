// Run with: npm test
// Public wording rules (standing rules, 11 Oct 2026): no scarcity or seat-count text anywhere a visitor
// can see it. The seat DATA stays in the database and the admin; it is just never displayed.
// Source-contract test over every non-admin source file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(e.name)) out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(root, p).split(path.sep).join('/');
// Not public: the admin panel, API routes, and the file that LISTS the banned phrases for the AI writer.
const pub = walk(root).filter((f) => !/^(app\/admin|components\/admin|app\/api|lib\/ai-content-rules\.ts)/.test(rel(f)));

const BANNED = [
  /\bseats?\s+left\b/i,
  /\bseats?\s+remaining\b/i,
  /\bseats?\s+available\b/i,
  /\blimited\s+seats?\b/i,
  /\bunlimited\s+seats?\b/i,
  /\bonly\s+\d+\s+seats?\b/i,
  /\bfilling\s+fast\b/i,
  /\bseat\s+availability\b/i,
];

test('no seat-count or scarcity wording in public source', () => {
  const hits = [];
  for (const f of pub) {
    fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      for (const re of BANNED) if (re.test(line)) hits.push(`${rel(f)}:${i + 1} ${re}`);
    });
  }
  assert.deepEqual(hits, []);
});

test('no component displays seatsAvailable / totalSeats', () => {
  const hits = [];
  for (const f of pub) {
    if (!/\.tsx$/.test(f)) continue;
    fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      // Passing the fields through as data is fine; rendering them is not.
      if (/\{[^}]*\b(b|batch)\.(seatsAvailable|totalSeats)\b[^}]*\}/.test(line) && !/=>|\?\?|!==|!=|<=|>=|===|==/.test(line)) hits.push(`${rel(f)}:${i + 1}`);
      if (/\{(seatStatus|seatsLeft|seats)\.[a-zA-Z]+\}/.test(line)) hits.push(`${rel(f)}:${i + 1}`);
    });
  }
  assert.deepEqual(hits, []);
});

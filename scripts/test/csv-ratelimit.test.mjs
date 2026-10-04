// Run with: npm test. CSV formula neutralising and the in-memory rate limiter.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvCell } from '../../src/lib/csv.ts';
import { createRateLimiter } from '../../src/lib/rate-limit.ts';

test('csvCell neutralises formula starters and quotes every cell', () => {
  assert.equal(csvCell('=HYPERLINK("http://x")'), `"'=HYPERLINK(""http://x"")"`);
  for (const v of ['+91 98765 43210', '-2+3', '@SUM(A1)', '\tx']) assert.ok(csvCell(v).startsWith(`"'`), v);
  assert.equal(csvCell('Ramesh, K'), '"Ramesh, K"');
  assert.equal(csvCell(null), '""');
  assert.equal(csvCell(42), '"42"');
});

test('rate limiter: max hits per window per key, then frees up', () => {
  const rl = createRateLimiter({ max: 2, windowMs: 1000 });
  assert.equal(rl.allow('a', 0), true);
  assert.equal(rl.allow('a', 10), true);
  assert.equal(rl.allow('a', 20), false);
  assert.equal(rl.allow('b', 20), true);
  assert.equal(rl.allow('a', 1011), true);
});

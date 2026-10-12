// Run with: npm test
// WhatsApp widget status line: one config value (WA_REPLY_MODE), office hours 09:00-21:00 IST.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { getWaStatus, WA_REPLY_MODE } = await import('../../src/lib/wa-status.ts');

// IST = UTC+5:30
const ist = (h, m = 0) => new Date(Date.UTC(2026, 9, 12, h - 5, m - 30));

test('default mode is office-hours', () => {
  assert.equal(WA_REPLY_MODE, 'office-hours');
});

test('office-hours: inside 09:00-21:00 IST shows reply time and the dot', () => {
  for (const d of [ist(9, 0), ist(12, 30), ist(20, 59)]) {
    assert.deepEqual(getWaStatus(d, 'office-hours'), { text: 'Typically replies in < 15 mins', online: true });
  }
});

test('office-hours: outside the hours shows the office-hours line, no dot', () => {
  for (const d of [ist(8, 59), ist(21, 0), ist(23, 30), ist(3, 0)]) {
    assert.deepEqual(getWaStatus(d, 'office-hours'), { text: 'We reply on WhatsApp during office hours', online: false });
  }
});

test('auto-reply: always the instant line, never a dot', () => {
  for (const d of [ist(3, 0), ist(12, 0)]) {
    assert.deepEqual(getWaStatus(d, 'auto-reply'), { text: 'Instant reply on WhatsApp', online: false });
  }
});

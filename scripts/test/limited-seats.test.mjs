// Run with: npm test   (Node's built-in runner; Node 24 imports .ts directly)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasLimitedSeats, isFillingUp } from '../../src/lib/limited-seats.ts';

const now = new Date('2026-09-28T00:00:00Z');
const inDays = (d) => new Date(now.getTime() + d * 86_400_000);
const batch = (over) => ({ status: 'upcoming', startDate: inDays(10), seatsAvailable: 3, totalSeats: 20, ...over });

test('null seat data never triggers "Limited seats"', () => {
  assert.equal(isFillingUp(batch({ seatsAvailable: null }), now), false);
  assert.equal(isFillingUp(batch({ totalSeats: null }), now), false);
  assert.equal(isFillingUp(batch({ seatsAvailable: undefined, totalSeats: undefined }), now), false);
  assert.equal(hasLimitedSeats([batch({ seatsAvailable: null, totalSeats: null })], now), false);
});

test('zero seat data never triggers it', () => {
  assert.equal(isFillingUp(batch({ seatsAvailable: 0 }), now), false);
  assert.equal(isFillingUp(batch({ totalSeats: 0 }), now), false);
});

test('an upcoming batch in the window with few seats left triggers it', () => {
  assert.equal(isFillingUp(batch({ seatsAvailable: 5, totalSeats: 40 }), now), true); // ≤ 5 left
  assert.equal(isFillingUp(batch({ seatsAvailable: 9, totalSeats: 30 }), now), true); // 30 % left
  assert.equal(isFillingUp(batch({ seatsAvailable: 10, totalSeats: 30 }), now), false); // 33 % left
});

test('only upcoming batches starting in the next 45 days count', () => {
  assert.equal(isFillingUp(batch({ status: 'ongoing' }), now), false);
  assert.equal(isFillingUp(batch({ startDate: inDays(-1) }), now), false);
  assert.equal(isFillingUp(batch({ startDate: inDays(46) }), now), false);
  assert.equal(hasLimitedSeats([], now), false);
});

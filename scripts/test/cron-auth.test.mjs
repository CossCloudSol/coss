// Run with: npm test. Cron route authorisation (src/lib/cron-auth.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAuthorizedCron } from '../../src/lib/cron-auth.ts';

const SECRET = 'a-long-enough-cron-secret-value';

test('the right bearer token passes; anything else is refused', () => {
  assert.equal(isAuthorizedCron(`Bearer ${SECRET}`, SECRET), true);
  assert.equal(isAuthorizedCron(`Bearer ${SECRET}x`, SECRET), false);
  assert.equal(isAuthorizedCron(SECRET, SECRET), false);
  assert.equal(isAuthorizedCron(null, SECRET), false);
});

test('fails closed without a secret: "Bearer undefined" no longer passes', () => {
  assert.equal(isAuthorizedCron('Bearer undefined', undefined), false);
  assert.equal(isAuthorizedCron('Bearer ', ''), false);
  assert.equal(isAuthorizedCron('Bearer short', 'short'), false);
});

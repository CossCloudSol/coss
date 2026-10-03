// Run with: npm test   (Node's built-in runner; Node 24 imports .ts directly)
// All numbers below are test fixtures; the site only ever shows Google's live values.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dedupeInFlight, failureLine, fetchPlaceRating, isNextInternalError, ratingGetter, ratingLabel } from '../../src/lib/google-places.ts';

const ENV = { GOOGLE_PLACES_API_KEY: 'test-key', GOOGLE_PLACE_ID_DILSUKHNAGAR: 'ChIJtest' };
const OK = { rating: 4.66, userRatingCount: 1234, googleMapsUri: 'https://maps.google.com/?cid=123' };
const reply = (status, body) => async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
const nextError = (digest) => Object.assign(new Error(`internal ${digest}`), { digest });

test('success: rating, count and the Maps link; the request is the Places API (New) shape', async () => {
  let seen;
  const r = await fetchPlaceRating(ENV, async (url, init) => { seen = { url, init }; return new Response(JSON.stringify(OK)); });
  assert.deepEqual(r, { rating: 4.66, count: 1234, mapsUri: 'https://maps.google.com/?cid=123' });
  assert.equal(seen.url, 'https://places.googleapis.com/v1/places/ChIJtest');
  assert.equal(seen.init.headers['X-Goog-Api-Key'], 'test-key');
  assert.equal(seen.init.headers['X-Goog-FieldMask'], 'rating,userRatingCount,googleMapsUri');
  assert.ok(seen.init.signal instanceof AbortSignal, 'request has a timeout signal');
  // Regression: an explicit cache option makes Next throw DynamicServerError
  // inside unstable_cache during static generation (the rating vanished on the preview).
  assert.equal('cache' in seen.init, false);
  assert.equal(ratingLabel(r), '★ 4.7/5 on Google (1,234 reviews)');
  assert.equal(ratingLabel({ rating: 5, count: 1 }), '★ 5.0/5 on Google (1 review)');
});

test('missing key or place id: throws without calling Google', async () => {
  let called = false;
  const f = async () => { called = true; return new Response('{}'); };
  await assert.rejects(fetchPlaceRating({ GOOGLE_PLACE_ID_DILSUKHNAGAR: 'x' }, f), /GOOGLE_PLACES_API_KEY is not set/);
  await assert.rejects(fetchPlaceRating({ GOOGLE_PLACES_API_KEY: 'k' }, f), /GOOGLE_PLACE_ID_DILSUKHNAGAR is not set/);
  assert.equal(called, false);
});

test('403, network error, timeout and bad data throw', async () => {
  await assert.rejects(fetchPlaceRating(ENV, reply(403, { error: { status: 'PERMISSION_DENIED' } })), /HTTP 403/);
  await assert.rejects(fetchPlaceRating(ENV, async () => { throw new TypeError('fetch failed'); }), /request failed: fetch failed/);
  const hang = (_url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason)));
  await assert.rejects(fetchPlaceRating(ENV, hang, 50), /timed out after 50 ms/);
  await assert.rejects(fetchPlaceRating(ENV, reply(200, 'not json')), /invalid JSON/);
  await assert.rejects(fetchPlaceRating(ENV, reply(200, { ...OK, rating: 7 })), /rating missing or out of range/);
  await assert.rejects(fetchPlaceRating(ENV, reply(200, { ...OK, userRatingCount: 0 })), /userRatingCount missing or invalid/);
  // No attribution link → no rating.
  await assert.rejects(fetchPlaceRating(ENV, reply(200, { rating: 4.7, userRatingCount: 10 })), /googleMapsUri missing or not a Google Maps link/);
  await assert.rejects(fetchPlaceRating(ENV, reply(200, { ...OK, googleMapsUri: 'https://evil.example/maps' })), /not a Google Maps link$/);
});

test('Next.js internals are never swallowed or wrapped', async () => {
  for (const digest of ['DYNAMIC_SERVER_USAGE', 'NEXT_NOT_FOUND', 'NEXT_REDIRECT;replace;/x;307;', 'BAILOUT_TO_CLIENT_SIDE_RENDERING']) {
    assert.equal(isNextInternalError(nextError(digest)), true, digest);
  }
  assert.equal(isNextInternalError(new Error('Places API HTTP 403')), false);
  assert.equal(isNextInternalError(null), false);

  // From fetch: rethrown as the same object, not "Places API request failed: …".
  const dyn = nextError('DYNAMIC_SERVER_USAGE');
  await assert.rejects(fetchPlaceRating(ENV, async () => { throw dyn; }), (err) => err === dyn);

  // From the getter: rethrown, and not logged.
  const logs = [];
  const get = ratingGetter(async () => { throw dyn; }, { log: (l) => logs.push(l) });
  await assert.rejects(get(), (err) => err === dyn);
  assert.deepEqual(logs, []);
  // A custom predicate (the server wrapper adds Next's isDynamicServerError) is honoured too.
  const custom = Object.assign(new Error('x'), { special: true });
  await assert.rejects(ratingGetter(async () => { throw custom; }, { isInternal: (e) => e?.special === true })(), (err) => err === custom);
});

test('failure log: one line, no URL, nothing key-shaped', () => {
  const line = failureLine(new Error('request to https://places.googleapis.com/v1/places/ChIJsecret?key=AIzaSyA1234567890abcdefghijklmnopqrstu failed\n  at x'));
  assert.equal(line, '[google-rating] hidden: request to [url] failed at x');
  assert.ok(!line.includes('\n'));
  assert.equal(failureLine(new Error('key AIzaSyA1234567890abcdefghijklmnopqrstu leaked')), '[google-rating] hidden: key [key] leaked');
});

// Next's unstable_cache stores resolved values only; this stand-in does the same.
function successOnlyCache(fn) {
  let hit = null;
  return async () => {
    if (hit) return hit;
    const v = await fn(); // a throw is not stored
    hit = v;
    return v;
  };
}

test('failures become null (logged once) and are not cached; a later success is', async () => {
  const replies = [reply(403, {}), reply(403, {}), reply(200, OK), reply(500, {})];
  let calls = 0;
  const logs = [];
  const get = ratingGetter(successOnlyCache(() => fetchPlaceRating(ENV, replies[calls++])), { log: (m) => logs.push(m) });

  assert.equal(await get(), null);
  assert.equal(await get(), null);
  assert.equal(calls, 2, 'each failure goes back to Google: nothing was cached');
  assert.deepEqual(logs, ['[google-rating] hidden: Places API HTTP 403'], 'the same failure is logged once');

  assert.deepEqual(await get(), { rating: 4.66, count: 1234, mapsUri: OK.googleMapsUri });
  assert.deepEqual(await get(), { rating: 4.66, count: 1234, mapsUri: OK.googleMapsUri });
  assert.equal(calls, 3, 'the success is served from the cache');
});

test('no key (local): null, never a throw', async () => {
  const get = ratingGetter(() => fetchPlaceRating({}), { log: () => {} });
  assert.equal(await get(), null);
});

test('concurrent renders share one in-flight request; the next call after it settles makes a new one', async () => {
  let calls = 0;
  const releases = [];
  const load = dedupeInFlight(() => {
    calls++;
    return new Promise((r) => releases.push(r));
  });
  const pending = Array.from({ length: 25 }, () => load());
  assert.equal(calls, 1, '25 concurrent callers, one request');
  releases[0]({ rating: 4.5, count: 10, mapsUri: OK.googleMapsUri });
  const results = await Promise.all(pending);
  assert.ok(results.every((r) => r.rating === 4.5));

  const next = load();
  assert.equal(calls, 2, 'settled: the next call is a new request');
  releases[1]({ rating: 4.4, count: 11, mapsUri: OK.googleMapsUri });
  assert.equal((await next).count, 11);

  // A failure is shared too, then cleared (not stuck).
  let failCalls = 0;
  const failing = dedupeInFlight(() => { failCalls++; return Promise.reject(new Error('Places API HTTP 503')); });
  const [a, b] = await Promise.allSettled([failing(), failing()]);
  assert.equal(a.status, 'rejected');
  assert.equal(b.status, 'rejected');
  assert.equal(failCalls, 1);
  await assert.rejects(failing(), /503/);
  assert.equal(failCalls, 2);
});

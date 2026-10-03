// Run with: npm test   (Node's built-in runner; Node 24 imports .ts directly)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchPlaceRating, ratingGetter, ratingLabel } from '../../src/lib/google-places.ts';

const ENV = { GOOGLE_PLACES_API_KEY: 'test-key', GOOGLE_PLACE_ID_DILSUKHNAGAR: 'ChIJtest' };
const OK = { rating: 4.66, userRatingCount: 1234, googleMapsUri: 'https://maps.google.com/?cid=123' };
const reply = (status, body) => async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });

test('success: rating, count and the Maps link; the request is the Places API (New) shape', async () => {
  let seen;
  const r = await fetchPlaceRating(ENV, async (url, init) => { seen = { url, init }; return new Response(JSON.stringify(OK)); });
  assert.deepEqual(r, { rating: 4.66, count: 1234, mapsUri: 'https://maps.google.com/?cid=123' });
  assert.equal(seen.url, 'https://places.googleapis.com/v1/places/ChIJtest');
  assert.equal(seen.init.headers['X-Goog-Api-Key'], 'test-key');
  assert.equal(seen.init.headers['X-Goog-FieldMask'], 'rating,userRatingCount,googleMapsUri');
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

test('403, timeout and bad data throw', async () => {
  await assert.rejects(fetchPlaceRating(ENV, reply(403, { error: { status: 'PERMISSION_DENIED' } })), /HTTP 403/);
  const hang = (_url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason)));
  await assert.rejects(fetchPlaceRating(ENV, hang, 50), /timed out after 50 ms/);
  await assert.rejects(fetchPlaceRating(ENV, reply(200, 'not json')), /invalid JSON/);
  await assert.rejects(fetchPlaceRating(ENV, reply(200, { ...OK, rating: 7 })), /bad rating/);
  await assert.rejects(fetchPlaceRating(ENV, reply(200, { ...OK, userRatingCount: 0 })), /bad userRatingCount/);
  // No attribution link → no rating.
  await assert.rejects(fetchPlaceRating(ENV, reply(200, { rating: 4.7, userRatingCount: 10 })), /no usable googleMapsUri/);
  await assert.rejects(fetchPlaceRating(ENV, reply(200, { ...OK, googleMapsUri: 'https://evil.example/maps' })), /no usable googleMapsUri/);
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
  const get = ratingGetter(successOnlyCache(() => fetchPlaceRating(ENV, replies[calls++])), (m) => logs.push(m));

  assert.equal(await get(), null);
  assert.equal(await get(), null);
  assert.equal(calls, 2, 'each failure goes back to Google: nothing was cached');
  assert.deepEqual(logs, ['[google-rating] hidden: Places API HTTP 403'], 'the same failure is logged once');

  assert.deepEqual(await get(), { rating: 4.66, count: 1234, mapsUri: OK.googleMapsUri });
  assert.deepEqual(await get(), { rating: 4.66, count: 1234, mapsUri: OK.googleMapsUri });
  assert.equal(calls, 3, 'the success is served from the cache');
});

test('no key (local): null, never a throw', async () => {
  const get = ratingGetter(() => fetchPlaceRating({}), () => {});
  assert.equal(await get(), null);
});

// Run with: npm test   (Node's built-in runner; Node 24 imports .ts directly)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPost, deletePost, getChannels, realSendsAllowed } from '../../src/lib/buffer-client.ts';

test('real sends are allowed only on the production deployment or with ALLOW_LOCAL_SENDS=1', () => {
  assert.deepEqual(realSendsAllowed({ VERCEL_ENV: 'production' }), { ok: true });
  assert.deepEqual(realSendsAllowed({ ALLOW_LOCAL_SENDS: '1' }), { ok: true });
  for (const env of [{}, { VERCEL_ENV: 'preview' }, { VERCEL_ENV: 'development' }, { ALLOW_LOCAL_SENDS: 'true' }, { ALLOW_LOCAL_SENDS: '0' }, { NODE_ENV: 'production' }]) {
    const g = realSendsAllowed(env);
    assert.equal(g.ok, false, JSON.stringify(env));
    assert.match(g.reason, /Buffer sends are disabled outside production \(VERCEL_ENV=(unset|preview|development)\)\. Nothing was sent\./);
  }
});

test('outside production createPost/deletePost refuse without calling Buffer; reads still work', async () => {
  const saved = { fetch: globalThis.fetch, vercel: process.env.VERCEL_ENV, allow: process.env.ALLOW_LOCAL_SENDS, key: process.env.BUFFER_API_KEY };
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push(JSON.parse(init.body).query.trim().split(/\s+/)[0]);
    return new Response(JSON.stringify({ data: { channels: [] } }), { status: 200 });
  };
  delete process.env.VERCEL_ENV;
  delete process.env.ALLOW_LOCAL_SENDS;
  process.env.BUFFER_API_KEY = 'test-key';
  try {
    const created = await createPost({ text: 'x', channelId: 'c', dueAt: new Date(Date.now() + 60_000), service: 'facebook' });
    assert.equal(created.ok, false);
    assert.equal(created.error.blocked, true);
    assert.equal(created.retryable, false);
    assert.match(created.error.message, /disabled outside production \(VERCEL_ENV=unset\)/);
    const deleted = await deletePost('p1');
    assert.equal(deleted.ok, false);
    assert.equal(deleted.error.blocked, true);
    assert.deepEqual(calls, [], 'no Buffer request was made');

    assert.equal((await getChannels()).ok, true);
    assert.deepEqual(calls, ['query']);
  } finally {
    globalThis.fetch = saved.fetch;
    for (const [k, v] of [['VERCEL_ENV', saved.vercel], ['ALLOW_LOCAL_SENDS', saved.allow], ['BUFFER_API_KEY', saved.key]]) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

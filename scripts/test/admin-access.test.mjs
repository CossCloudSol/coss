// Run with: npm test. The admin access table (src/lib/admin-access.ts) that the
// middleware, every /api/admin handler, the admin layout and both menus use.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requiredAccess, isAllowed } from '../../src/lib/admin-access.ts';
import { ROLE_PERMISSIONS } from '../../src/lib/permissions.ts';

const need = (path, method) => {
  const a = requiredAccess(path, method);
  return a.kind === 'permission' ? a.key : a.kind;
};

test('API reads need the area\'s :view, writes :edit, deletes :delete', () => {
  assert.equal(need('/api/admin/leads', 'GET'), 'leads:view');
  assert.equal(need('/api/admin/leads/abc', 'PATCH'), 'leads:edit');
  assert.equal(need('/api/admin/leads/abc', 'DELETE'), 'leads:delete');
  assert.equal(need('/api/admin/courses/abc', 'PUT'), 'content:edit');
  assert.equal(need('/api/admin/stats', 'GET'), 'dashboard:view');
  assert.equal(need('/api/admin/promo-banners', 'GET'), 'content:view');
  assert.equal(need('/admin/promo-banners'), 'content:edit'); // the page itself needs edit
  assert.equal(need('/api/admin/whatsapp-clicks', 'GET'), 'whatsappclicks:view');
  assert.equal(need('/api/admin/whatsapp', 'GET'), 'whatsapp:view');
});

test('closed by default: no :delete key, unknown areas, super-admin areas', () => {
  assert.equal(need('/api/admin/seo/pages/x', 'DELETE'), 'super'); // there is no seo:delete
  assert.equal(need('/api/admin/something-new', 'POST'), 'super');
  assert.equal(need('/api/admin/users', 'GET'), 'super');
  assert.equal(need('/api/admin/geo/branches', 'GET'), 'super');
  assert.equal(need('/api/admin/revalidate', 'POST'), 'super');
  assert.equal(need('/admin/batches'), 'super');
});

test('own notifications for any signed-in admin; the test send is super-admin only', () => {
  assert.equal(need('/api/admin/notifications', 'GET'), 'signed-in');
  assert.equal(need('/api/admin/notifications/abc/read', 'POST'), 'signed-in');
  assert.equal(need('/api/admin/push/subscribe', 'POST'), 'signed-in');
  assert.equal(need('/api/admin/notifications/test', 'POST'), 'super');
});

test('public: login, logout, and the screens around login', () => {
  for (const [p, m] of [['/api/admin/auth', 'POST'], ['/api/admin/auth/logout', 'POST'], ['/admin/login'], ['/admin/unauthorized'], ['/admin/forgot-password']]) {
    assert.equal(need(p, m), 'public', p);
  }
  assert.equal(need('/api/admin/auth/other', 'POST'), 'super');
});

test('role matrix: Support and Content/SEO get exactly their areas', () => {
  const support = { role: 'SUPPORT_HELPDESK', permissions: ROLE_PERMISSIONS.SUPPORT_HELPDESK };
  const content = { role: 'CONTENT_SEO_MANAGER', permissions: ROLE_PERMISSIONS.CONTENT_SEO_MANAGER };
  const ok = (u, p, m) => isAllowed(requiredAccess(p, m), u);
  assert.ok(ok(support, '/api/admin/leads', 'GET'));
  assert.ok(!ok(support, '/api/admin/leads/x', 'PATCH'));
  assert.ok(ok(support, '/api/admin/courses', 'GET'));
  assert.ok(!ok(support, '/api/admin/courses/x', 'PUT'));
  assert.ok(!ok(support, '/api/admin/settings', 'PATCH'));
  assert.ok(!ok(support, '/admin/users'));
  assert.ok(ok(content, '/api/admin/courses/x', 'PUT'));
  assert.ok(ok(content, '/api/admin/seo/pages/x', 'PATCH'));
  assert.ok(!ok(content, '/api/admin/leads', 'GET'));
  assert.ok(!ok(content, '/api/admin/courses/x', 'DELETE'));
  assert.ok(!ok(content, '/api/admin/notifications/test', 'POST'));
  assert.ok(ok({ role: 'SUPER_ADMIN', permissions: [] }, '/api/admin/users', 'POST'));
  assert.ok(!ok(null, '/api/admin/notifications', 'GET'));
  assert.ok(!ok({ role: undefined, permissions: [] }, '/api/admin/users', 'GET')); // no role is never super admin
});

test('WRITE_KEYS matches the :edit/:delete keys in permissions.ts, and every area has a :view key', async () => {
  const { WRITE_KEYS, ROUTE_PERMISSIONS } = await import('../../src/lib/admin-access.ts');
  const { ALL_PERMISSIONS } = await import('../../src/lib/permissions.ts');
  assert.deepEqual([...WRITE_KEYS].sort(), ALL_PERMISSIONS.filter((p) => /:(edit|delete)$/.test(p)).sort());
  for (const [, key] of ROUTE_PERMISSIONS) if (key) assert.ok(ALL_PERMISSIONS.includes(`${key.split(':')[0]}:view`), key);
});

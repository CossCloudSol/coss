// Run with: npm test. Admin write allowlists (src/lib/pick-fields.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickFields, SITE_SETTINGS_FIELDS, CONTENT_BLOCK_FIELDS, HOMEPAGE_FIELDS } from '../../src/lib/pick-fields.ts';

test('only listed fields are kept; id, timestamps and unknown keys are dropped', () => {
  const r = pickFields({ id: 'x', createdAt: '2020', isAdmin: true, primaryPhone: '+91 88851 66007', schemaOrgEnabled: false }, SITE_SETTINGS_FIELDS);
  assert.deepEqual(r, { data: { primaryPhone: '+91 88851 66007', schemaOrgEnabled: false } });
});

test('wrong types are refused, nullable strings accept null', () => {
  assert.ok('error' in pickFields({ schemaOrgEnabled: 'yes' }, SITE_SETTINGS_FIELDS));
  assert.deepEqual(pickFields({ email: null }, SITE_SETTINGS_FIELDS), { data: { email: null } });
  assert.ok('error' in pickFields({ sortOrder: 1.5 }, CONTENT_BLOCK_FIELDS));
  assert.ok('error' in pickFields({ featuredCourseIds: ['a', 2] }, HOMEPAGE_FIELDS));
  assert.deepEqual(pickFields({ metadata: { a: 1 }, sortOrder: 2 }, CONTENT_BLOCK_FIELDS), { data: { metadata: { a: 1 }, sortOrder: 2 } });
});

test('a body that is not an object is refused', () => {
  for (const b of [null, 'x', [1], 3]) assert.ok('error' in pickFields(b, HOMEPAGE_FIELDS));
});

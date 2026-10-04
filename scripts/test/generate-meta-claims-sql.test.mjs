import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contextNeedles, parseCsv } from '../generate-meta-claims-sql.mjs';

const match = (text, phrase) => ({ phrase, index: text.indexOf(phrase) });

test('a phrase opening the text keeps its first word (no "X training" left to match the fixed code)', () => {
  const text = 'Best Big Data training institute in Hyderabad. Hadoop, Spark, Hive & Kafka with hands-on labs.';
  const needles = contextNeedles(text, match(text, 'Best Big Data training'));
  assert.deepEqual(needles, ['Best Big Data training institute in Hyderabad. ']);
  assert.ok(needles.every((n) => n.startsWith('Best ')));
});

test('context is cut back to whole words on both sides, never into the phrase', () => {
  const text = 'Learn Full Stack Python in Hyderabad with Coss Cloud Solutions. Get placed in top companies in HITEC City, Gachibowli, Madhapur.';
  const [after, before] = contextNeedles(text, match(text, 'top companies'));
  assert.ok(after.startsWith('top companies'));
  assert.ok(before.endsWith('top companies'));
  assert.equal(before.trim(), 'Solutions. Get placed in top companies');
});

test('the bare phrase only when it is the whole text', () => {
  assert.deepEqual(contextNeedles('Best SAP Fico Training', match('Best SAP Fico Training', 'Best SAP Fico Training')), ['Best SAP Fico Training']);
});

test('parseCsv: SQL Editor export with quotes, commas, newlines, CRLF and a BOM', () => {
  const bom = String.fromCharCode(0xfeff);
  const csv = `${bom}tbl,key,col,txt\r\nPageSeo,home,metaDescription,"Top IT training, ""since 2010"""\r\nCourse,c1 slug-a,description,"Line one\nline two"\r\n`;
  assert.deepEqual(parseCsv(csv), [
    { tbl: 'PageSeo', key: 'home', col: 'metaDescription', txt: 'Top IT training, "since 2010"' },
    { tbl: 'Course', key: 'c1 slug-a', col: 'description', txt: 'Line one\nline two' },
  ]);
});

test('parseCsv: empty fields and no trailing newline', () => {
  assert.deepEqual(parseCsv('tbl,key,col,txt\nBlogPost,b1 x,seoDesc,'), [{ tbl: 'BlogPost', key: 'b1 x', col: 'seoDesc', txt: '' }]);
});

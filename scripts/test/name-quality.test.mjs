// Run with: npm test. Admin "check name" flag (src/lib/name-quality.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nameLooksOff } from '../../src/lib/name-quality.ts';

test('real names, including Indian and initialled names, are not flagged', () => {
  for (const n of ['Lakshmi', 'Krishna Prasanth', 'Shrividya', 'K. Ramesh', 'Venkatesh', "O'Brien", 'Anne-Marie', 'Sai', 'Md Arshad', 'Nikhil Reddy', 'Srinivas', 'Prathyusha', 'Bhrigu', 'Aishwarya']) {
    assert.equal(nameLooksOff(n), false, n);
  }
});

test('random typing and placeholders are flagged', () => {
  for (const n of ['asdfgh', 'qwerty', 'aaaa', 'xzkqtv', 'bcdfg', 'test', 'Dummy', 'hjkl']) assert.equal(nameLooksOff(n), true, n);
});

test('other scripts and empty values get no opinion', () => {
  for (const n of ['రమేష్', 'राजेश', '', null, undefined]) assert.equal(nameLooksOff(n), false, String(n));
});

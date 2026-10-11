// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseName, demoLabel, initialsOf, trackOf, courseLinkFor, withoutHonorific } from '../../src/lib/faculty.ts';

test('name is split for the demo button; the stored name itself is never rewritten', () => {
  assert.deepEqual(parseName('Mr. Tharun Kumar Moluguri'), { honorific: 'Mr.', rest: 'Tharun Kumar Moluguri', first: 'Tharun' });
  assert.equal(demoLabel('Mr. Srikanth'), 'Demo with Mr. Srikanth');
  assert.equal(demoLabel('Mrs. Lakshmi Devi'), 'Demo with Mrs. Lakshmi');
  assert.equal(demoLabel('Dr Anitha Rao'), 'Demo with Dr. Anitha');
  assert.equal(demoLabel('Tharun Kumar Moluguri'), 'Demo with Tharun', 'no honorific stored: none is invented');
  assert.equal(demoLabel('K. Ramesh'), 'Demo with Ramesh', 'an initial is not a first name');
});

test('initials skip the honorific', () => {
  assert.equal(initialsOf('Mr. Ramesh Rudrapati'), 'RR');
  assert.equal(initialsOf('Mr. Mahender'), 'MA');
});

test('tracks come from the admin category, then the title', () => {
  assert.equal(trackOf('Cloud & DevOps', ''), 'cloud');
  assert.equal(trackOf(null, 'Lead Trainer - Multi Cloud ( AWS / Azure ) With DevOps & Linux'), 'cloud');
  assert.equal(trackOf(null, 'Lead Trainer - Red Hat Linux'), 'linux');
  assert.equal(trackOf(null, 'Lead Trainer - Data Science & Data Analytics'), 'ai-data');
  assert.equal(trackOf(null, 'Lead Trainer - AI FullStack ( Generative Ai, Agentic Ai, Prompt Engineering'), 'ai-data');
  assert.equal(trackOf(null, 'Lead Trainer - Cyber Security'), 'cyber');
  assert.equal(trackOf(null, 'Lead Trainer - Digital Marketing / Performance Marketing'), 'marketing');
  assert.equal(trackOf(null, 'Placement Coordinator'), 'hr');
  assert.equal(trackOf(null, 'Spoken English'), 'other');
});

test('TEACHES chips link to a course page, else to the course search', () => {
  const courses = [
    { title: 'AWS DevOps', url: '/aws-devops-training-institute-in-hyderabad' },
    { title: 'Azure DevOps Training', url: '/azure-devops-training-in-hyderabad' },
    { title: 'Data Science', url: '/data-science' },
  ];
  assert.equal(courseLinkFor('AWS DevOps', courses), '/aws-devops-training-institute-in-hyderabad');
  assert.equal(courseLinkFor('azure devops', courses), '/azure-devops-training-in-hyderabad');
  assert.equal(courseLinkFor('Quantum Magic', courses), '/courses?q=Quantum%20Magic');
});

test('the trainers without an honorific are listed for the client', () => {
  assert.deepEqual(withoutHonorific([{ name: 'Mr. Aditya' }, { name: 'Tharun Kumar Moluguri' }]), ['Tharun Kumar Moluguri']);
});

test('page source: no selection checkbox, no inline long bio, drawer + demo form wired', () => {
  const view = fs.readFileSync(new URL('../../src/components/faculty/FacultyView.tsx', import.meta.url), 'utf8');
  assert.ok(!/type="checkbox"/.test(view) && !/line-clamp/.test(view));
  assert.match(view, /data-open-profile/);
  assert.match(view, /demoLabel\(t\.name\)/);
  assert.match(view, /years industry/);
});

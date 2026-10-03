// Run with: npm test   (Node's built-in runner; Node 24 imports .ts directly)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { approvalChanges, formatIst, manualDraftNote, revertedNote, sentChannels, skippedNote } from '../../src/lib/social-post-state.ts';

const approved = {
  content: 'Cyber Security batch starts Monday.',
  channels: 'linkedin,facebook,instagram',
  imageUrl: null,
  imageAltText: null,
  linkUrl: null,
  courseId: 'c1',
  hook: 'Hands-on labs every week',
  hashtags: '#CyberSecurity #CEH',
  scheduledFor: new Date('2026-10-03T09:51:00.000Z'),
};

// What the edit form sends when "Save Changes" is clicked with nothing changed.
const formResave = {
  content: 'Cyber Security batch starts Monday.',
  channels: 'linkedin,facebook,instagram',
  imageUrl: null,
  imageAltText: null,
  linkUrl: null,
  courseId: 'c1',
  hook: 'Hands-on labs every week',
  hashtags: '#CyberSecurity #CEH',
  scheduledFor: new Date('2026-10-03T09:51:00.000Z'),
};

test('saving an approved post unchanged is not a change (it stays approved)', () => {
  assert.deepEqual(approvalChanges(approved, formResave), []);
  // "" vs null, channel order and surrounding spaces don't count either.
  assert.deepEqual(approvalChanges(approved, { ...formResave, imageUrl: '', channels: 'instagram, linkedin,facebook', hook: ' Hands-on labs every week ' }), []);
  // Keys the request didn't send aren't compared.
  assert.deepEqual(approvalChanges(approved, { content: approved.content }), []);
});

test('real edits are listed by name', () => {
  assert.deepEqual(approvalChanges(approved, { ...formResave, hook: 'New hook' }), ['hook']);
  assert.deepEqual(
    approvalChanges(approved, { ...formResave, content: 'Edited text', channels: 'linkedin', scheduledFor: new Date('2026-10-04T09:51:00.000Z') }),
    ['post text', 'channels', 'schedule'],
  );
  assert.deepEqual(approvalChanges(approved, { courseId: null }), ['course']);
});

test('every automatic revert / skip note says what happened, when (IST) and what to do', () => {
  const at = new Date('2026-10-03T09:35:00.000Z'); // 3:05 pm IST
  assert.equal(formatIst(at), '3 Oct, 3:05 pm IST');
  assert.equal(revertedNote(['hook', 'post text'], at), 'Moved back to Draft 3 Oct, 3:05 pm IST: edited after approval (changed: hook, post text). Approve again to queue it.');
  assert.match(manualDraftNote(at), /^Moved back to Draft 3 Oct, 3:05 pm IST by an admin \("To Draft"\)\. Approve again/);
  assert.equal(
    skippedNote('more than 10 posts were due in this run', at),
    'Not sent 3 Oct, 3:05 pm IST: more than 10 posts were due in this run. Still queued; it goes in the next run (or use Send now).',
  );
});

test('channels already sent are read from bufferPostIds (old untagged ids ignored)', () => {
  assert.deepEqual([...sentChannels('linkedin:a1,facebook:b2')], [['linkedin', 'a1'], ['facebook', 'b2']]);
  assert.deepEqual([...sentChannels('oldid123')], []);
  assert.deepEqual([...sentChannels(null)], []);
});

/**
 * Writes content/posts/_dates.json: each MDX post's real publish date (first commit) and
 * last-changed date (last commit, or today for uncommitted edits), from git history.
 * Run after adding, renaming or editing a post, and commit the result with it
 * (scripts/test/post-dates.test.mjs fails while the file is out of date).
 * Usage: node scripts/build-post-dates.mjs
 */
import { DATES_FILE, writePostDates } from './lib/post-dates.mjs';

const dates = writePostDates();
const values = Object.values(dates);
console.log(`${DATES_FILE}: ${values.length} posts, published ${new Set(values.map((d) => d.published)).size} distinct dates, modified ${new Set(values.map((d) => d.modified)).size} distinct dates`);

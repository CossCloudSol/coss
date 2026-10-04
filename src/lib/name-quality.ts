/**
 * Flags a lead name that looks typed at random ("asdfgh", "qqqq", "xzkqtv")
 * so the admin can check it before calling. Never used to reject a form:
 * real names vary too much. Latin script only; other scripts get no flag.
 */
export function nameLooksOff(name: string | null | undefined): boolean {
  const n = (name ?? '').trim().toLowerCase();
  if (!/^[a-z .'’-]+$/.test(n)) return false;
  if (/^(test|testing|asdf|abc|abcd|xyz|dummy|sample|none|nil|na|null|demo)$/.test(n)) return true;
  const letters = n.replace(/[^a-z]/g, '');
  if (letters.length < 4) return false;
  if (/(.)\1{3,}/.test(letters)) return true; // aaaa
  if (/[bcdfghjklmnpqrstvwxz]{5,}/.test(letters)) return true; // 5+ consonants in a row
  if (!/[aeiouy]/.test(letters)) return true; // no vowel at all
  return /qwer|wert|asdf|sdfg|zxcv|xcvb|hjkl|uiop|ghjk/.test(letters); // keyboard runs
}

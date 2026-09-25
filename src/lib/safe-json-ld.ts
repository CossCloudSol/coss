/**
 * Serialises a value for the body of a <script type="application/ld+json">.
 *
 * JSON.stringify leaves "<" untouched, so any string value containing
 * "</script>" (for example an admin-edited schema override) would close the
 * tag early and let the rest run as HTML. Escaping every "<" as \u003c keeps
 * the parsed JSON identical while making the tag impossible to break out of.
 */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

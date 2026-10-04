/**
 * One quoted CSV cell. A value that starts with = + - @ (or a tab or carriage
 * return) is prefixed with an apostrophe so a spreadsheet shows it as text
 * instead of running it as a formula: lead names and messages are typed by
 * the public. Shared by every admin CSV export.
 */
export function csvCell(value: string | number | null | undefined): string {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

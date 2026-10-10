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

/**
 * Excel opens a UTF-8 CSV as ANSI unless the file starts with a byte-order mark,
 * so "→" or a non-Latin name shows as garbage. Exports that can hold such text
 * write this first.
 */
export const CSV_BOM = '﻿';

/** CSV text with the UTF-8 byte-order mark in front (once). */
export function withCsvBom(csv: string): string {
  return csv.startsWith(CSV_BOM) ? csv : CSV_BOM + csv;
}

/**
 * When the header strip may say "· Limited seats". Pure and dependency-free
 * so it can be unit-tested with `node --test` (scripts/test).
 *
 * Reads, per batch: status, startDate, seatsAvailable, totalSeats.
 * A batch counts only if it is "upcoming", starts within the next
 * LIMITED_SEATS_WINDOW_DAYS days, and has BOTH seat numbers present and
 * above 0; then it is "filling up" when at most LIMITED_SEATS_MAX seats, or
 * at most LIMITED_SEATS_SHARE of its capacity, remain. Missing or zero seat
 * data never triggers the message.
 */

export const LIMITED_SEATS_WINDOW_DAYS = 45;
export const LIMITED_SEATS_MAX = 5;
export const LIMITED_SEATS_SHARE = 0.3;

export interface SeatBatch {
  status: string;
  startDate: Date | string;
  seatsAvailable: number | null | undefined;
  totalSeats: number | null | undefined;
}

export function isFillingUp(batch: SeatBatch, now: Date = new Date()): boolean {
  if (batch.status !== 'upcoming') return false;
  const start = new Date(batch.startDate).getTime();
  if (Number.isNaN(start) || start < now.getTime() || start > now.getTime() + LIMITED_SEATS_WINDOW_DAYS * 86_400_000) return false;
  const left = batch.seatsAvailable;
  const total = batch.totalSeats;
  if (typeof left !== 'number' || typeof total !== 'number' || left <= 0 || total <= 0) return false;
  return left <= LIMITED_SEATS_MAX || left / total <= LIMITED_SEATS_SHARE;
}

export function hasLimitedSeats(batches: SeatBatch[], now: Date = new Date()): boolean {
  return batches.some((b) => isFillingUp(b, now));
}

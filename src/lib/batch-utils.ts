export function getSeatStatus(
  mode: string,
  seatsAvailable: number | null | undefined,
  totalSeats: number | null | undefined,
) {
  if (mode === 'Online') {
    return { type: 'unlimited', label: 'Unlimited seats', color: 'green', percent: 0 }
  }

  if (seatsAvailable === null || seatsAvailable === undefined) {
    return { type: 'unknown', label: 'Contact for availability', color: 'gray', percent: 0 }
  }

  const total = totalSeats || 20
  const percent = Math.round(((total - seatsAvailable) / total) * 100)

  if (seatsAvailable === 0) {
    return { type: 'full', label: 'Batch full', color: 'red', percent: 100 }
  }
  if (seatsAvailable <= 3) {
    return { type: 'critical', label: `Only ${seatsAvailable} seat${seatsAvailable === 1 ? '' : 's'} left`, color: 'red', percent }
  }
  if (seatsAvailable <= 6) {
    return { type: 'low', label: `${seatsAvailable} seats left`, color: 'amber', percent }
  }
  return { type: 'available', label: `${seatsAvailable} seats available`, color: 'green', percent }
}

export function formatBatchDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * `status` is set manually in the admin panel and drifts independently of
 * `startDate` — a batch dated in the past can still be marked "upcoming" in
 * the DB. Derive the effective display status from startDate instead, while
 * still respecting the DB status for completed/cancelled batches (those stay
 * excluded from public listings by the DB query, not by this function).
 */
export function getEffectiveBatchStatus(status: string, startDate: Date | string): string {
  if (status === 'completed' || status === 'cancelled') return status
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return start <= today ? 'ongoing' : 'upcoming'
}

/**
 * `startDate` is optional so admin CRUD screens (which need to show the raw
 * DB status for editing, not a derived one) can keep calling this with just
 * `status`. Public-facing surfaces should always pass `startDate`.
 */
export function getBatchStatusBadge(status: string, startDate?: Date | string) {
  const effective = startDate !== undefined ? getEffectiveBatchStatus(status, startDate) : status
  const map: Record<string, { label: string; color: string }> = {
    upcoming:  { label: 'Upcoming',  color: 'blue' },
    ongoing:   { label: 'Ongoing',   color: 'green' },
    completed: { label: 'Completed', color: 'gray' },
    cancelled: { label: 'Cancelled', color: 'red' },
  }
  return map[effective] ?? { label: effective, color: 'gray' }
}

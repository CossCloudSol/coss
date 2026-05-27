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

export function getBatchStatusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    upcoming:  { label: 'Upcoming',  color: 'blue' },
    ongoing:   { label: 'Ongoing',   color: 'green' },
    completed: { label: 'Completed', color: 'gray' },
    cancelled: { label: 'Cancelled', color: 'red' },
  }
  return map[status] ?? { label: status, color: 'gray' }
}

import { format, formatDistanceToNow, isAfter, parseISO } from 'date-fns'

/**
 * Format a date string or Date object for display.
 */
export function formatDate(
  date: string | Date | null | undefined,
  fmt: string = 'MMM d, yyyy'
): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt)
  } catch {
    return '—'
  }
}

/**
 * Relative time e.g. "3 days ago"
 */
export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return '—'
  }
}

/**
 * Check if an invoice/bill is overdue.
 */
export function isOverdue(dueDate: string | Date): boolean {
  try {
    const d = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate
    return isAfter(new Date(), d)
  } catch {
    return false
  }
}

/**
 * Format a date as an ISO string (YYYY-MM-DD) for DB inserts.
 */
export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

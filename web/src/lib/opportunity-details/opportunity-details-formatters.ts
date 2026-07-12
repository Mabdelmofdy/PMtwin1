/** Presentation formatters for Opportunity Details 4.0 — no domain mutations. */

import { formatDate } from '@/lib/format.ts'

export function formatRelativeUpdatedAt(iso?: string | null): string | undefined {
  if (!iso) return undefined
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return formatDate(iso) || undefined
  const diffMs = Date.now() - ms
  if (diffMs < 0) return formatDate(iso) || undefined
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'Updated just now'
  if (minutes < 60) return `Updated ${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `Updated ${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 14) return `Updated ${days} day${days === 1 ? '' : 's'} ago`
  return `Updated ${formatDate(iso)}`
}

export function formatOptionalDate(iso?: string | null): string | undefined {
  if (!iso) return undefined
  const formatted = formatDate(iso)
  return formatted || undefined
}

export function formatDurationLabel(
  duration?: number | string | null,
  startDate?: string | null,
  endDate?: string | null,
): string | undefined {
  if (duration != null && String(duration).trim()) {
    const raw = String(duration).trim()
    if (/^\d+$/.test(raw)) return `${raw} days`
    return raw
  }
  if (!startDate || !endDate) return undefined
  const start = Date.parse(startDate)
  const end = Date.parse(endDate)
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return undefined
  const days = Math.round((end - start) / 86_400_000)
  if (days < 1) return undefined
  return `${days} day${days === 1 ? '' : 's'}`
}

export type TimelineState = 'upcoming' | 'active' | 'overdue' | 'unscheduled' | 'completed'

export function deriveTimelineState(input: {
  readonly startDate?: string | null
  readonly deadline?: string | null
  readonly opportunityStatus?: string | null
}): TimelineState {
  const status = (input.opportunityStatus ?? '').toLowerCase()
  if (['completed', 'closed', 'cancelled'].includes(status)) {
    return 'completed'
  }
  if (['contracted', 'executing', 'in_execution'].includes(status)) {
    return 'active'
  }
  const start = input.startDate ? Date.parse(input.startDate) : NaN
  const deadline = input.deadline ? Date.parse(input.deadline) : NaN
  const now = Date.now()
  if (Number.isNaN(start) && Number.isNaN(deadline)) return 'unscheduled'
  if (!Number.isNaN(deadline) && deadline < now) return 'overdue'
  if (!Number.isNaN(start) && start > now) return 'upcoming'
  return 'active'
}

export function omitEmpty<T extends Record<string, unknown>>(
  record: T,
): Partial<T> {
  const next: Partial<T> = {}
  for (const [key, value] of Object.entries(record)) {
    if (value == null) continue
    if (typeof value === 'string' && !value.trim()) continue
    if (Array.isArray(value) && value.length === 0) continue
    ;(next as Record<string, unknown>)[key] = value
  }
  return next
}

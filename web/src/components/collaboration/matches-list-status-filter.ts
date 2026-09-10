import { resolveCanonicalStatus } from '@/lib/status-display.ts'

/** Default Matching list filter — active/non-expired statuses. */
export const MATCH_LIST_DEFAULT_STATUS_FILTER = 'all'

/** Explicit history view — every persisted match status, including Expired. */
export const MATCH_LIST_ALL_STATUSES_FILTER = 'all_statuses'

export function matchListStatusFilterLabel(statusFilter: string): string {
  if (statusFilter === MATCH_LIST_DEFAULT_STATUS_FILTER) return 'All active'
  if (statusFilter === MATCH_LIST_ALL_STATUSES_FILTER) return 'All statuses'
  if (!statusFilter) return ''
  return statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
}

/**
 * List/read-model status predicate only. Does not change persisted Match status.
 * Default (`all`) excludes Expired; Confirmed and other non-expired statuses remain visible.
 */
export function matchPassesListStatusFilter(
  matchStatus: string | undefined,
  statusFilter: string,
): boolean {
  const canonical = resolveCanonicalStatus('match', matchStatus)
  if (statusFilter === MATCH_LIST_ALL_STATUSES_FILTER) return true
  if (statusFilter === MATCH_LIST_DEFAULT_STATUS_FILTER) {
    return canonical !== 'expired'
  }
  return canonical === statusFilter
}

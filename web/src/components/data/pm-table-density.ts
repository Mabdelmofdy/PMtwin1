/**
 * PM DataTable density modes — comfortable (default) and compact (Stripe-dense).
 * Future: wire to user preference hook; no persistence in Phase 5A.
 */

export type PmTableDensity = 'comfortable' | 'compact'

export const pmTableDensityOptions: readonly PmTableDensity[] = [
  'comfortable',
  'compact',
] as const

export const pmTableDensityLabels: Record<PmTableDensity, string> = {
  comfortable: 'Comfortable',
  compact: 'Compact',
}

/** Resolves the root table class list for a density mode. */
export function resolveTableDensityClasses(
  density: PmTableDensity = 'comfortable',
): string {
  if (density === 'compact') {
    return 'pm-table-dense text-sm'
  }
  return 'text-sm'
}

/** Cell padding classes per density — used when not relying on pm-table-dense alone. */
export function resolveTableCellPadding(
  density: PmTableDensity = 'comfortable',
): { head: string; cell: string } {
  if (density === 'compact') {
    return { head: 'h-9 px-2.5', cell: 'px-2.5 py-2' }
  }
  return { head: 'h-12 px-3', cell: 'p-3' }
}

/** Skeleton row height per density. */
export function resolveTableSkeletonRowHeight(
  density: PmTableDensity = 'comfortable',
): string {
  return density === 'compact' ? 'h-9' : 'h-12'
}

/**
 * Normalizes an unknown density value to a valid mode.
 * Reserved for future user-preference resolution.
 */
export function normalizeTableDensity(
  value: string | null | undefined,
  fallback: PmTableDensity = 'comfortable',
): PmTableDensity {
  if (value === 'compact' || value === 'comfortable') {
    return value
  }
  return fallback
}

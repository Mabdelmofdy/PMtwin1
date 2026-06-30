/**
 * PM DataTable column visibility helpers — pure utilities for column toggle UI.
 */

export type PmTableColumnVisibility = Record<string, boolean>

export type PmTableColumnMeta = {
  readonly id: string
  readonly label: string
  readonly defaultVisible?: boolean
  readonly hideable?: boolean
}

/** Builds default visibility map from column definitions. */
export function buildDefaultColumnVisibility(
  columns: readonly PmTableColumnMeta[],
): PmTableColumnVisibility {
  const visibility: PmTableColumnVisibility = {}
  for (const col of columns) {
    visibility[col.id] = col.defaultVisible !== false
  }
  return visibility
}

/** Returns columns that should render given the visibility map. */
export function resolveVisibleColumns<T extends PmTableColumnMeta>(
  columns: readonly T[],
  visibility: PmTableColumnVisibility,
): T[] {
  return columns.filter(
    (col) => col.hideable === false || visibility[col.id] !== false,
  )
}

/** Toggles a single column's visibility (no-op for non-hideable columns). */
export function toggleColumnVisibility(
  visibility: PmTableColumnVisibility,
  columnId: string,
  columns: readonly PmTableColumnMeta[],
): PmTableColumnVisibility {
  const meta = columns.find((c) => c.id === columnId)
  if (!meta || meta.hideable === false) {
    return visibility
  }
  return {
    ...visibility,
    [columnId]: !visibility[columnId],
  }
}

/** Count of currently visible hideable columns. */
export function countVisibleColumns(
  columns: readonly PmTableColumnMeta[],
  visibility: PmTableColumnVisibility,
): number {
  return resolveVisibleColumns(columns, visibility).length
}

/** Whether at least one data column remains visible. */
export function hasVisibleDataColumns(
  columns: readonly PmTableColumnMeta[],
  visibility: PmTableColumnVisibility,
): boolean {
  return countVisibleColumns(columns, visibility) > 0
}

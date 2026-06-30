/**
 * PM DataTable selection helpers — pure utilities, no backend wiring.
 */

export type PmTableSelectionMode = 'none' | 'single' | 'multiple'

export type PmTableCheckboxState = 'unchecked' | 'checked' | 'indeterminate'

export type PmTableSelectionState = {
  readonly selectedIds: ReadonlySet<string>
  readonly mode: PmTableSelectionMode
}

/** Creates an empty selection state for the given mode. */
export function createSelectionState(
  mode: PmTableSelectionMode = 'none',
): PmTableSelectionState {
  return { selectedIds: new Set(), mode }
}

/** Returns whether a row id is currently selected. */
export function isRowSelected(
  state: PmTableSelectionState,
  rowId: string,
): boolean {
  return state.selectedIds.has(rowId)
}

/** Returns the header checkbox state for select-all in multiple mode. */
export function resolveHeaderCheckboxState(
  state: PmTableSelectionState,
  visibleRowIds: readonly string[],
): PmTableCheckboxState {
  if (state.mode !== 'multiple' || visibleRowIds.length === 0) {
    return 'unchecked'
  }

  const selectedCount = visibleRowIds.filter((id) =>
    state.selectedIds.has(id),
  ).length

  if (selectedCount === 0) return 'unchecked'
  if (selectedCount === visibleRowIds.length) return 'checked'
  return 'indeterminate'
}

/** Toggles a single row — respects single vs multiple mode. */
export function toggleRowSelection(
  state: PmTableSelectionState,
  rowId: string,
): PmTableSelectionState {
  if (state.mode === 'none') return state

  const next = new Set(state.selectedIds)

  if (state.mode === 'single') {
    if (next.has(rowId)) {
      next.delete(rowId)
    } else {
      next.clear()
      next.add(rowId)
    }
    return { ...state, selectedIds: next }
  }

  if (next.has(rowId)) {
    next.delete(rowId)
  } else {
    next.add(rowId)
  }
  return { ...state, selectedIds: next }
}

/** Selects or deselects all visible rows (multiple mode only). */
export function toggleSelectAll(
  state: PmTableSelectionState,
  visibleRowIds: readonly string[],
): PmTableSelectionState {
  if (state.mode !== 'multiple') return state

  const headerState = resolveHeaderCheckboxState(state, visibleRowIds)
  const next = new Set(state.selectedIds)

  if (headerState === 'checked') {
    for (const id of visibleRowIds) {
      next.delete(id)
    }
  } else {
    for (const id of visibleRowIds) {
      next.add(id)
    }
  }

  return { ...state, selectedIds: next }
}

/** Clears all selections. */
export function clearSelection(
  state: PmTableSelectionState,
): PmTableSelectionState {
  return { ...state, selectedIds: new Set() }
}

/** Count of selected rows. */
export function countSelected(state: PmTableSelectionState): number {
  return state.selectedIds.size
}

/** Whether bulk actions should be shown. */
export function hasSelection(state: PmTableSelectionState): boolean {
  return state.selectedIds.size > 0
}

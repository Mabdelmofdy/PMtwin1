import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  clearSelection,
  createSelectionState,
  hasSelection,
  isRowSelected,
  resolveHeaderCheckboxState,
  toggleRowSelection,
  toggleSelectAll,
} from '@/components/data/pm-table-selection.ts'

describe('pm-table-selection', () => {
  it('creates empty selection state', () => {
    const state = createSelectionState('multiple')
    assert.equal(state.selectedIds.size, 0)
    assert.equal(state.mode, 'multiple')
  })

  it('toggles row in multiple mode', () => {
    const state = createSelectionState('multiple')
    const next = toggleRowSelection(state, 'row-1')
    assert.equal(isRowSelected(next, 'row-1'), true)
    const cleared = toggleRowSelection(next, 'row-1')
    assert.equal(isRowSelected(cleared, 'row-1'), false)
  })

  it('replaces selection in single mode', () => {
    let state = createSelectionState('single')
    state = toggleRowSelection(state, 'a')
    state = toggleRowSelection(state, 'b')
    assert.equal(isRowSelected(state, 'a'), false)
    assert.equal(isRowSelected(state, 'b'), true)
  })

  it('resolves header checkbox indeterminate state', () => {
    let state = createSelectionState('multiple')
    state = toggleRowSelection(state, 'a')
    assert.equal(
      resolveHeaderCheckboxState(state, ['a', 'b']),
      'indeterminate',
    )
    state = toggleSelectAll(state, ['a', 'b'])
    assert.equal(resolveHeaderCheckboxState(state, ['a', 'b']), 'checked')
  })

  it('toggle select all selects and deselects visible rows', () => {
    let state = createSelectionState('multiple')
    state = toggleSelectAll(state, ['a', 'b'])
    assert.equal(hasSelection(state), true)
    state = toggleSelectAll(state, ['a', 'b'])
    assert.equal(hasSelection(state), false)
  })

  it('clearSelection removes all ids', () => {
    let state = createSelectionState('multiple')
    state = toggleRowSelection(state, 'x')
    state = clearSelection(state)
    assert.equal(state.selectedIds.size, 0)
  })
})

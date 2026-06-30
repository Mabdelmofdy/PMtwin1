import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildDefaultColumnVisibility,
  hasVisibleDataColumns,
  resolveVisibleColumns,
  toggleColumnVisibility,
} from '@/components/data/pm-table-columns.ts'

const columns = [
  { id: 'name', label: 'Name', defaultVisible: true, hideable: true },
  { id: 'status', label: 'Status', defaultVisible: true, hideable: true },
  { id: 'id', label: 'ID', defaultVisible: false, hideable: false },
] as const

describe('pm-table-columns', () => {
  it('builds default visibility from column meta', () => {
    const visibility = buildDefaultColumnVisibility(columns)
    assert.equal(visibility.name, true)
    assert.equal(visibility.id, false)
  })

  it('filters to visible columns only', () => {
    const visibility = { name: true, status: false, id: false }
    const visible = resolveVisibleColumns([...columns], visibility)
    assert.deepEqual(
      visible.map((c) => c.id),
      ['name', 'id'],
    )
  })

  it('toggles hideable column visibility', () => {
    const visibility = buildDefaultColumnVisibility(columns)
    const next = toggleColumnVisibility(visibility, 'status', columns)
    assert.equal(next.status, false)
    const unchanged = toggleColumnVisibility(visibility, 'id', columns)
    assert.equal(unchanged.id, false)
  })

  it('reports whether data columns remain visible', () => {
    const allHiddenInMap = { name: false, status: false, id: false }
    // Non-hideable columns (id) remain visible
    assert.equal(hasVisibleDataColumns(columns, allHiddenInMap), true)

    const hideableOnly = [
      { id: 'name', label: 'Name', hideable: true },
      { id: 'status', label: 'Status', hideable: true },
    ]
    assert.equal(
      hasVisibleDataColumns(hideableOnly, { name: false, status: false }),
      false,
    )
  })
})

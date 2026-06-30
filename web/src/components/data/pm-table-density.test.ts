import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  normalizeTableDensity,
  resolveTableCellPadding,
  resolveTableDensityClasses,
  resolveTableSkeletonRowHeight,
} from '@/components/data/pm-table-density.ts'

describe('pm-table-density', () => {
  it('resolves comfortable density classes', () => {
    assert.equal(resolveTableDensityClasses('comfortable'), 'text-sm')
  })

  it('resolves compact density classes with pm-table-dense', () => {
    assert.match(resolveTableDensityClasses('compact'), /pm-table-dense/)
  })

  it('returns tighter cell padding for compact mode', () => {
    const compact = resolveTableCellPadding('compact')
    const comfortable = resolveTableCellPadding('comfortable')
    assert.notEqual(compact.cell, comfortable.cell)
  })

  it('returns shorter skeleton rows for compact mode', () => {
    assert.equal(resolveTableSkeletonRowHeight('compact'), 'h-9')
    assert.equal(resolveTableSkeletonRowHeight('comfortable'), 'h-12')
  })

  it('normalizes unknown density to fallback', () => {
    assert.equal(normalizeTableDensity('invalid'), 'comfortable')
    assert.equal(normalizeTableDensity('compact'), 'compact')
    assert.equal(normalizeTableDensity(null, 'compact'), 'compact')
  })
})

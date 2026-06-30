import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  resolveTableEmptyState,
  shouldShowTableEmpty,
} from '@/components/data/pm-table-empty-helpers.ts'

describe('pm-table-empty', () => {
  it('applies no-data defaults', () => {
    const resolved = resolveTableEmptyState({ variant: 'no-data' })
    assert.equal(resolved.title, 'No records yet')
    assert.match(resolved.description, /first record/)
  })

  it('applies no-results defaults', () => {
    const resolved = resolveTableEmptyState({ variant: 'no-results' })
    assert.equal(resolved.title, 'No results found')
  })

  it('allows title override', () => {
    const resolved = resolveTableEmptyState({
      variant: 'no-data',
      title: 'Custom title',
    })
    assert.equal(resolved.title, 'Custom title')
  })

  it('shouldShowTableEmpty respects loading and error', () => {
    assert.equal(shouldShowTableEmpty(0), true)
    assert.equal(shouldShowTableEmpty(5), false)
    assert.equal(shouldShowTableEmpty(0, { loading: true }), false)
    assert.equal(shouldShowTableEmpty(0, { error: true }), false)
  })
})

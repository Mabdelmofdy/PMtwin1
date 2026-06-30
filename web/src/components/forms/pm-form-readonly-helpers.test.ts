import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  groupReadonlyFields,
  isReadonlyValueEmpty,
  resolveReadonlyValue,
} from '@/components/forms/pm-form-readonly-helpers.ts'

describe('pm-form-readonly-helpers', () => {
  it('returns em dash for empty values', () => {
    assert.equal(resolveReadonlyValue({ value: null }), '—')
    assert.equal(resolveReadonlyValue({ value: '' }), '—')
  })

  it('uses custom empty fallback', () => {
    assert.equal(
      resolveReadonlyValue({ value: null, emptyFallback: 'N/A' }),
      'N/A',
    )
  })

  it('formats booleans', () => {
    assert.equal(resolveReadonlyValue({ value: true }), 'Yes')
    assert.equal(resolveReadonlyValue({ value: false }), 'No')
  })

  it('joins arrays', () => {
    assert.equal(resolveReadonlyValue({ value: ['a', 'b'] }), 'a, b')
    assert.equal(resolveReadonlyValue({ value: [] }), '—')
  })

  it('uses custom formatter', () => {
    assert.equal(
      resolveReadonlyValue({
        value: 1500,
        formatter: (v) => `SAR ${v}`,
      }),
      'SAR 1500',
    )
  })

  it('isReadonlyValueEmpty detects empty values', () => {
    assert.equal(isReadonlyValueEmpty(null), true)
    assert.equal(isReadonlyValueEmpty('text'), false)
  })

  it('groups fields by section', () => {
    const fields = [
      { sectionId: 'a', id: '1' },
      { sectionId: 'b', id: '2' },
      { sectionId: 'a', id: '3' },
    ]
    const groups = groupReadonlyFields(fields)
    assert.equal(groups.a.length, 2)
    assert.equal(groups.b.length, 1)
  })
})

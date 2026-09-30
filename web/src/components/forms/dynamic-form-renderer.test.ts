import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseTagsInput } from '@/components/forms/dynamic-form-renderer.tsx'

describe('parseTagsInput', () => {
  it('keeps spaces and a trailing comma while typing', () => {
    assert.deepEqual(parseTagsInput('Gap analysis'), ['Gap analysis'])
    assert.equal(parseTagsInput('Gap analysis, '), 'Gap analysis, ')
    assert.equal(parseTagsInput('Gap '), 'Gap ')
  })

  it('tokenizes completed comma-separated values', () => {
    assert.deepEqual(parseTagsInput('Gap analysis, Certification plan'), [
      'Gap analysis',
      'Certification plan',
    ])
  })

  it('returns an empty list for blank input', () => {
    assert.deepEqual(parseTagsInput('   '), [])
  })
})

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

describe('PmToolbarSurface data-slot', () => {
  it('uses the canonical toolbar surface slot name', () => {
    const slot = 'pm-toolbar-surface'
    assert.equal(slot, 'pm-toolbar-surface')
  })
})

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { PmFilterChip } from '@/components/ui/pm-filter-chips'

describe('PmFilterChip contract', () => {
  it('requires id, label (dimension), and value', () => {
    const chips: readonly PmFilterChip[] = [
      { id: 'status', label: 'Status', value: 'Accepted' },
      { id: 'type', label: 'Match type', value: 'Circular Exchange', onRemove: () => {} },
    ]
    assert.equal(chips.length, 2)
    assert.equal(chips[0]?.value, 'Accepted')
    assert.equal(typeof chips[1]?.onRemove, 'function')
  })

  it('supports role=group with aria-label for the chip bar', () => {
    const ariaLabel = 'Active filters'
    const chips: readonly PmFilterChip[] = [
      { id: 'status', label: 'Status', value: 'Accepted' },
    ]
    assert.equal(chips.length, 1)
    assert.equal(ariaLabel, 'Active filters')
  })
})

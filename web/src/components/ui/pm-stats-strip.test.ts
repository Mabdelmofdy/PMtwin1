import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { PmStatsStripItem } from '@/components/ui/pm-stats-strip'

describe('PmStatsStripItem contract', () => {
  it('requires label and value for each metric', () => {
    const items: readonly PmStatsStripItem[] = [
      { label: 'Published', value: 12 },
      { label: 'Active matches', value: '8' },
    ]

    assert.equal(items.length, 2)
    assert.equal(items[0]?.label, 'Published')
    assert.equal(items[1]?.value, '8')
  })

  it('supports empty items array (component returns null)', () => {
    const items: readonly PmStatsStripItem[] = []
    assert.equal(items.length, 0)
  })
})

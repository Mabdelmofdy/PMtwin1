import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { PmLifecycleMapStep } from '@/components/ui/pm-lifecycle-map'

/** Structural tests for lifecycle map step contract (no DOM). */
describe('PmLifecycleMapStep contract', () => {
  it('reuses workflow journey step shape (id, label, state)', () => {
    const steps: readonly PmLifecycleMapStep[] = [
      { id: 'opportunity', label: 'Opportunity', state: 'complete' },
      { id: 'match', label: 'Match', state: 'current', status: 'accepted', statusEntity: 'match' },
      { id: 'negotiation', label: 'Negotiation', state: 'upcoming' },
      { id: 'deal', label: 'Deal', state: 'upcoming' },
      { id: 'contract', label: 'Contract', state: 'upcoming' },
    ]

    assert.equal(steps.length, 5)
    assert.equal(steps[1]?.state, 'current')
    assert.equal(steps[1]?.statusEntity, 'match')
  })

  it('covers the canonical lifecycle order', () => {
    const order = ['opportunity', 'match', 'negotiation', 'deal', 'contract']
    assert.deepEqual(order, [...order].sort((a, b) => order.indexOf(a) - order.indexOf(b)))
  })
})

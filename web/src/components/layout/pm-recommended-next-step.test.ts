import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { PM_RECOMMENDED_NEXT_STEP } from '@/components/layout/pm-recommended-next-step'

describe('PM_RECOMMENDED_NEXT_STEP', () => {
  it('uses unified recommended next step title', () => {
    assert.equal(PM_RECOMMENDED_NEXT_STEP.title, 'Recommended next step')
  })

  it('builds entity-specific descriptions', () => {
    assert.match(PM_RECOMMENDED_NEXT_STEP.description('negotiation'), /negotiation/)
  })
})

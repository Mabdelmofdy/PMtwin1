import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isMatchingPoolOpportunity } from '@/domain/matching/matching-pool-eligibility.ts'
import {
  allowedCommercialComponentTypesForSubModel,
  filterCommercialComponentTypesByExchangeModes,
} from '@/domain/opportunity-commercial-structure/allowed-components.ts'

describe('isMatchingPoolOpportunity', () => {
  it('requires lifecycle published and non-withdrawn visibility', () => {
    assert.equal(
      isMatchingPoolOpportunity({ status: 'published', visibilityStatus: 'published' }),
      true,
    )
    assert.equal(
      isMatchingPoolOpportunity({ status: 'published', visibilityStatus: undefined }),
      true,
    )
    assert.equal(
      isMatchingPoolOpportunity({ status: 'published', visibilityStatus: 'closed' }),
      false,
    )
    assert.equal(
      isMatchingPoolOpportunity({ status: 'published', visibilityStatus: 'archived' }),
      false,
    )
    assert.equal(
      isMatchingPoolOpportunity({ status: 'matched', visibilityStatus: 'published' }),
      false,
    )
  })
})

describe('allowedCommercialComponentTypesForSubModel', () => {
  it('hides barter for competition_rfp and project_jv', () => {
    const rfp = allowedCommercialComponentTypesForSubModel('competition_rfp')
    assert.ok(rfp.includes('cash'))
    assert.equal(rfp.includes('barter'), false)

    const jv = allowedCommercialComponentTypesForSubModel('project_jv')
    assert.ok(jv.includes('equity'))
    assert.ok(jv.includes('cash'))
    assert.equal(jv.includes('barter'), false)
  })

  it('keeps barter available for strategic_alliance', () => {
    const alliance = allowedCommercialComponentTypesForSubModel('strategic_alliance')
    assert.ok(alliance.includes('barter'))
  })

  it('maps hybrid allowance to custom without inventing barter', () => {
    const types = filterCommercialComponentTypesByExchangeModes(['cash', 'hybrid'])
    assert.deepEqual([...types], ['cash', 'custom'])
  })
})

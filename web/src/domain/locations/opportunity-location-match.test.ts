import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Opportunity } from '@/types/domain.ts'
import { opportunityMatchesLocationScopes } from './opportunity-location-match.ts'

describe('opportunityMatchesLocationScopes', () => {
  it('matches when coverage includes the filtered city and primary differs', () => {
    const opportunity = {
      id: 'opp-1',
      title: 'Multi-city offer',
      status: 'published',
      location: 'uae/dubai-emirate/dubai',
      coverageAreas: ['sa/riyadh/riyadh-city', 'sa/makkah/jeddah'],
    } as Opportunity

    assert.equal(
      opportunityMatchesLocationScopes(opportunity, ['sa/riyadh/riyadh-city']),
      true,
    )
    assert.equal(
      opportunityMatchesLocationScopes(opportunity, ['sa/eastern-province/dammam']),
      false,
    )
  })

  it('matches legacy free-text primary location', () => {
    const opportunity = {
      id: 'opp-2',
      title: 'Legacy',
      status: 'published',
      location: 'Riyadh, Saudi Arabia',
    } as Opportunity

    assert.equal(
      opportunityMatchesLocationScopes(opportunity, ['sa/riyadh/riyadh-city']),
      true,
    )
  })
})

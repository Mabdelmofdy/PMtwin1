import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Opportunity } from '@/types/domain.ts'
import { opportunityToPost } from './opportunity-post-adapter.ts'

describe('opportunityToPost location derivation', () => {
  it('derives engine labels from stored scope ids without persisting duplicates', () => {
    const opportunity = {
      id: 'opp-1',
      title: 'Need BIM',
      status: 'published',
      intent: 'need',
      location: 'sa/riyadh/riyadh-city',
      coverageAreas: ['uae/dubai-emirate/dubai', 'gcc'],
      attributes: { targetRole: 'Architect' },
      normalized: {
        role: 'Architect',
        requiredServices: ['BIM'],
      },
    } as Opportunity

    const post = opportunityToPost(opportunity)

    assert.equal(post.location, 'Riyadh City')
    assert.equal(post.normalized?.location, 'Riyadh City')
    assert.ok(post.normalized?.coverageScopes?.includes('Dubai'))
    assert.ok(post.normalized?.coverageScopes?.includes('GCC'))
    // Persisted opportunity was not mutated
    assert.equal(opportunity.location, 'sa/riyadh/riyadh-city')
    assert.equal(
      (opportunity.normalized as { location?: string } | undefined)?.location,
      undefined,
    )
  })

  it('tolerates legacy free-text location strings', () => {
    const opportunity = {
      id: 'opp-legacy',
      title: 'Legacy',
      status: 'published',
      intent: 'offer',
      location: 'Riyadh, Saudi Arabia',
      collaborationAttributes: { serviceArea: 'Jeddah' },
    } as Opportunity

    const post = opportunityToPost(opportunity)
    assert.equal(post.location, 'Riyadh City')
    assert.ok(post.normalized?.coverageScopes?.includes('Jeddah'))
  })
})

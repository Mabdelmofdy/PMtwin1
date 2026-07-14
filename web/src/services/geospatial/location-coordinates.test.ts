import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Opportunity } from '@/types/domain.ts'
import {
  resolveOpportunityCoordinates,
  resolvePublishedOpportunityMapPoints,
} from './location-coordinates.ts'

const baseOpportunity: Opportunity = {
  id: 'opp-test',
  title: 'Test opportunity',
  status: 'published',
}

describe('location-coordinates', () => {
  it('resolves region coordinates from seed location fields', () => {
    const coords = resolveOpportunityCoordinates({
      ...baseOpportunity,
      location: 'Riyadh, Saudi Arabia',
      locationCountry: 'sa',
      locationRegion: 'riyadh',
    } as Opportunity)

    assert.ok(coords)
    assert.equal(coords.lat, 24.7136)
    assert.equal(coords.lng, 46.6753)
  })

  it('resolves city names from free-text location', () => {
    const coords = resolveOpportunityCoordinates({
      ...baseOpportunity,
      location: 'Jeddah, Saudi Arabia',
    })

    assert.ok(coords)
    assert.equal(coords.lat, 21.4858)
    assert.equal(coords.lng, 39.1925)
  })

  it('builds map points only for resolvable published listings', () => {
    const points = resolvePublishedOpportunityMapPoints([
      {
        ...baseOpportunity,
        id: 'opp-1',
        location: 'Riyadh, Saudi Arabia',
        locationCountry: 'sa',
        locationRegion: 'riyadh',
      } as Opportunity,
      {
        ...baseOpportunity,
        id: 'opp-2',
        location: '',
      },
    ])

    assert.equal(points.length, 1)
    assert.equal(points[0]?.opportunity.id, 'opp-1')
  })
})

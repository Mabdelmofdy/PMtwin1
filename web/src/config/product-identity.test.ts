import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Opportunity } from '@/types/domain.ts'
import { buildViewerContext } from '@/lib/entity-view-visibility.ts'
import { filterOpportunitiesByOwnershipFilter } from '@/config/product-identity.ts'

function opportunity(
  overrides: Partial<Opportunity> & Pick<Opportunity, 'id'>,
): Opportunity {
  return {
    title: overrides.title ?? overrides.id,
    status: 'published',
    creatorId: 'seed-user-002',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  } as Opportunity
}

describe('filterOpportunitiesByOwnershipFilter', () => {
  const mine = opportunity({
    id: 'opp-mine',
    workspaceId: 'ws-personal-seed-user-002',
    ownerPartyId: 'party-individual-seed-user-002',
    creatorId: 'seed-user-002',
  })
  const company = opportunity({
    id: 'opp-company',
    workspaceId: 'ws-company-a',
    ownerPartyId: 'party-company-a',
    creatorId: 'colleague-1',
    organizationId: 'org-1',
  })
  const marketplace = opportunity({
    id: 'opp-market',
    workspaceId: 'ws-other',
    ownerPartyId: 'party-other',
    creatorId: 'other-user',
    organizationId: 'org-other',
  })

  it('keeps canonical owned opportunities in the mine filter', () => {
    const viewer = buildViewerContext({
      userId: 'seed-user-002',
      status: 'active',
      activeWorkspaceId: 'ws-personal-seed-user-002',
      activePartyId: 'party-individual-seed-user-002',
    })
    const filtered = filterOpportunitiesByOwnershipFilter(
      [mine, company, marketplace],
      viewer,
      'mine',
      () => undefined,
      undefined,
    )
    assert.deepEqual(
      filtered.map((item) => item.id),
      ['opp-mine'],
    )
  })

  it('does not drop mine items when only creatorId would match without workspace context', () => {
    const viewer = buildViewerContext({
      userId: 'seed-user-002',
      status: 'active',
      activeWorkspaceId: 'ws-personal-seed-user-002',
      activePartyId: 'party-individual-seed-user-002',
    })
    const filtered = filterOpportunitiesByOwnershipFilter(
      [mine],
      viewer,
      'mine',
      () => undefined,
    )
    assert.equal(filtered.length, 1)
    assert.equal(filtered[0]?.id, 'opp-mine')
  })

  it('classifies org-shared opportunities as company', () => {
    const viewer = buildViewerContext({
      userId: 'seed-user-002',
      status: 'active',
      activeWorkspaceId: 'ws-personal-seed-user-002',
      activePartyId: 'party-individual-seed-user-002',
    })
    const filtered = filterOpportunitiesByOwnershipFilter(
      [mine, company, marketplace],
      viewer,
      'company',
      (creatorId) => (creatorId === 'colleague-1' ? 'org-1' : undefined),
      'org-1',
    )
    assert.deepEqual(
      filtered.map((item) => item.id),
      ['opp-company'],
    )
  })
})

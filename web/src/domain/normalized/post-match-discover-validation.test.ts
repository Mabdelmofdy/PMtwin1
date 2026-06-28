import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { DiscoverPostMatchCommand } from '@pm-twin/commands'
import {
  discoverPostMatchStrongKey,
  validateDiscoverPostMatchCommand,
} from '@/domain/normalized/post-match-discover-validation.ts'

const oneWayBase = {
  commandType: 'DiscoverPostMatch' as const,
  aggregateId: 'pm-1',
  clientRequestId: 'req-1',
  matchType: 'one_way' as const,
  matchScore: 0.9,
  needOpportunityId: 'need-1',
  offerOpportunityId: 'offer-1',
  matchCriteria: { skillMatch: 1 },
  participants: [{ userId: 'u1', role: 'need_owner' }],
}

describe('validateDiscoverPostMatchCommand', () => {
  it('accepts valid one_way command', () => {
    const errors = validateDiscoverPostMatchCommand(oneWayBase)
    assert.deepEqual(errors, [])
  })

  it('rejects one_way without needOpportunityId', () => {
    const errors = validateDiscoverPostMatchCommand({
      ...oneWayBase,
      needOpportunityId: '',
    })
    assert.ok(errors.some((e) => e.includes('needOpportunityId')))
  })

  it('rejects two_way without complete sides', () => {
    const command = {
      commandType: 'DiscoverPostMatch',
      aggregateId: 'pm-2',
      clientRequestId: 'req-2',
      matchType: 'two_way',
      matchScore: 0.8,
      sideA: { userId: 'u1', needId: '', offerId: 'o1' },
      sideB: { userId: 'u2', needId: 'n2', offerId: 'o2' },
      participants: [{ userId: 'u1', role: 'need_owner' }],
    } satisfies DiscoverPostMatchCommand
    const errors = validateDiscoverPostMatchCommand(command)
    assert.ok(errors.some((e) => e.includes('sideA.needId')))
  })

  it('rejects consortium without roles', () => {
    const command = {
      commandType: 'DiscoverPostMatch',
      aggregateId: 'pm-3',
      clientRequestId: 'req-3',
      matchType: 'consortium',
      matchScore: 0.7,
      leadNeedId: 'lead-1',
      roles: [],
      participants: [{ userId: 'u1', role: 'consortium_lead' }],
    } satisfies DiscoverPostMatchCommand
    const errors = validateDiscoverPostMatchCommand(command)
    assert.ok(errors.some((e) => e.includes('roles')))
  })

  it('rejects circular when links do not cover cycle', () => {
    const command = {
      commandType: 'DiscoverPostMatch',
      aggregateId: 'pm-4',
      clientRequestId: 'req-4',
      matchType: 'circular',
      matchScore: 0.75,
      cycle: ['u1', 'u2', 'u3'],
      links: [
        {
          fromCreatorId: 'u1',
          toCreatorId: 'u2',
          needId: 'n1',
          offerId: 'o2',
          score: 0.8,
        },
      ],
      participants: [{ userId: 'u1', role: 'chain_participant' }],
    } satisfies DiscoverPostMatchCommand
    const errors = validateDiscoverPostMatchCommand(command)
    assert.ok(errors.some((e) => e.includes('links must cover every step')))
  })
})

describe('discoverPostMatchStrongKey', () => {
  it('returns strong key for each topology', () => {
    assert.equal(
      discoverPostMatchStrongKey(oneWayBase),
      'one_way:need-1:offer-1',
    )

    const twoWay = {
      commandType: 'DiscoverPostMatch',
      aggregateId: 'pm-b',
      clientRequestId: 'req-b',
      matchType: 'two_way',
      matchScore: 0.8,
      sideA: { userId: 'u1', needId: 'n1', offerId: 'o1' },
      sideB: { userId: 'u2', needId: 'n2', offerId: 'o2' },
      participants: [{ userId: 'u1', role: 'need_owner' }],
    } satisfies DiscoverPostMatchCommand
    assert.equal(discoverPostMatchStrongKey(twoWay), 'two_way:n1:o1|n2:o2')
  })
})

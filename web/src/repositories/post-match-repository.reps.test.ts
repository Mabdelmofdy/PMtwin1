import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { PostMatch } from '@/types/domain.ts'
import { MemoryStorageAdapter } from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { PostMatchRepository } from '@/repositories/post-match-repository.ts'

describe('PostMatchRepository.getByUser representative visibility', () => {
  it('includes matches where the user is in representativeUserIds', () => {
    const match: PostMatch = {
      id: 'pm-rep-1',
      matchType: 'one_way',
      status: 'discovered',
      matchScore: 0.8,
      needOpportunityId: 'need-1',
      offerOpportunityId: 'offer-1',
      participants: [
        {
          userId: 'company-proxy',
          role: 'need_owner',
          participantStatus: 'pending',
          partyId: 'party-company-1',
          representativeUserIds: ['employee-a'],
        },
        {
          userId: 'user-offer',
          role: 'offer_provider',
          participantStatus: 'pending',
        },
      ],
    }
    const repo = new PostMatchRepository(new MemoryStorageAdapter(), () => [match])
    const forRep = repo.getByUser('employee-a')
    assert.equal(forRep.length, 1)
    assert.equal(forRep[0]?.id, 'pm-rep-1')
    assert.equal(repo.getByUser('stranger').length, 0)
  })
})

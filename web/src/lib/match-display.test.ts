import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { formatMatchDisplayTitle, resolveMatchNeedOfferTitles } from '@/lib/match-display.ts'
import type { PostMatch } from '@/types/domain.ts'

const match: PostMatch = {
  id: 'pm-1',
  status: 'discovered',
  matchType: 'one_way',
  matchScore: 0.82,
  needOpportunityId: 'need-1',
  offerOpportunityId: 'offer-1',
}

describe('match-display', () => {
  it('resolves need and offer titles for pairing', () => {
    const pairing = resolveMatchNeedOfferTitles(match, (id) => {
      if (id === 'need-1') return { id, title: 'Architect Needed', status: 'published' }
      if (id === 'offer-1') return { id, title: 'Structural Engineer Available', status: 'published' }
      return undefined
    })

    assert.equal(pairing.needTitle, 'Architect Needed')
    assert.equal(pairing.offerTitle, 'Structural Engineer Available')
    assert.equal(
      formatMatchDisplayTitle(match, (id) =>
        id === 'need-1'
          ? { id, title: 'Architect Needed', status: 'published' }
          : { id, title: 'Structural Engineer Available', status: 'published' },
      ),
      'Architect Needed ↔ Structural Engineer Available',
    )
  })
})

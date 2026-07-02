import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatContractDisplayTitle,
  formatDealDisplayTitle,
  formatMatchPairingLabel,
  formatNegotiationDisplayTitle,
  formatOpportunityDisplayTitle,
  UNTITLED_CONTRACT,
  UNTITLED_DEAL,
  UNTITLED_NEGOTIATION,
  UNTITLED_OPPORTUNITY,
} from '@/lib/entity-display-titles.ts'
import type { Negotiation } from '@/types/domain.ts'

describe('entity-display-titles', () => {
  it('formats opportunity title with fallback', () => {
    assert.equal(formatOpportunityDisplayTitle({ title: 'Hospital Expansion' }), 'Hospital Expansion')
    assert.equal(formatOpportunityDisplayTitle({ title: '  ' }), UNTITLED_OPPORTUNITY)
  })

  it('formats deal title with fallback', () => {
    assert.equal(formatDealDisplayTitle({ title: 'Design Collaboration' }), 'Design Collaboration')
    assert.equal(formatDealDisplayTitle(undefined), UNTITLED_DEAL)
  })

  it('formats negotiation title from linked opportunity', () => {
    const negotiation = {
      id: 'seed-neg-01',
      needOpportunityId: 'seed-opp-001',
      status: 'active',
    } satisfies Negotiation

    const title = formatNegotiationDisplayTitle(negotiation, (id) =>
      id === 'seed-opp-001' ? { id, title: 'Hospital Expansion', status: 'published' } : undefined,
    )
    assert.equal(title, 'Hospital Expansion Negotiation')
    assert.equal(formatNegotiationDisplayTitle({ id: 'n1', status: 'active' }), UNTITLED_NEGOTIATION)
  })

  it('formats contract title from deal or opportunity subjects', () => {
    assert.equal(
      formatContractDisplayTitle({ dealTitle: 'Airport Design Deal' }),
      'Airport Design Deal Contract',
    )
    assert.equal(
      formatContractDisplayTitle({ needTitle: 'Architect Needed' }),
      'Architect Needed Contract',
    )
    assert.equal(formatContractDisplayTitle({}), UNTITLED_CONTRACT)
  })

  it('formats match pairing label', () => {
    assert.equal(
      formatMatchPairingLabel('Need title', 'Offer title'),
      'Need title ↔ Offer title',
    )
  })
})

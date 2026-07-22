import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCommercialAgreementStoredTitle,
  formatContractDisplayTitle,
  formatDealDisplayTitle,
  formatDealDisplayTitleWithOpportunities,
  formatMatchPairingLabel,
  formatNegotiationDisplayTitle,
  formatOpportunityDisplayTitle,
  isTechnicalStoredTitle,
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

  it('skips technical deal titles in favor of Need/Offer subjects', () => {
    assert.equal(
      formatDealDisplayTitle(
        { title: 'Commercial Agreement – pm-e2cf6f2d-ba01-4382-b5cb-a8523adc1f51' },
        {
          needTitle: 'BIM Architect for Riyadh tower',
          offerTitle: 'BIM Architect delivery (Revit)',
        },
      ),
      'BIM Architect for Riyadh tower ↔ BIM Architect delivery (Revit)',
    )
    assert.equal(
      formatDealDisplayTitle({ title: 'Commercial Agreement – pm-confirmed' }),
      UNTITLED_DEAL,
    )
  })

  it('builds stored commercial agreement titles from subjects', () => {
    assert.equal(
      buildCommercialAgreementStoredTitle({
        needTitle: 'BIM Architect for Riyadh tower',
        offerTitle: 'BIM Architect delivery (Revit)',
      }),
      'BIM Architect for Riyadh tower ↔ BIM Architect delivery (Revit)',
    )
    assert.equal(buildCommercialAgreementStoredTitle({}), UNTITLED_DEAL)
  })

  it('detects technical stored titles', () => {
    assert.equal(isTechnicalStoredTitle('Commercial Agreement – pm-confirmed'), true)
    assert.equal(isTechnicalStoredTitle('Deal – pm-1'), true)
    assert.equal(isTechnicalStoredTitle('Airport Design Deal'), false)
  })

  it('formats deal title via opportunity lookup', () => {
    const title = formatDealDisplayTitleWithOpportunities(
      {
        title: 'Commercial Agreement – pm-1',
        needOpportunityId: 'need-1',
        offerOpportunityId: 'offer-1',
      },
      (id) =>
        id === 'need-1'
          ? { id, title: 'Need A', status: 'published' }
          : id === 'offer-1'
            ? { id, title: 'Offer B', status: 'published' }
            : undefined,
    )
    assert.equal(title, 'Need A ↔ Offer B')
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
    assert.equal(
      formatContractDisplayTitle({
        dealTitle: 'Commercial Agreement – pm-e2cf6f2d-ba01-4382-b5cb-a8523adc1f51',
        needTitle: 'BIM Architect for Riyadh tower',
        offerTitle: 'BIM Architect delivery (Revit)',
      }),
      'BIM Architect for Riyadh tower ↔ BIM Architect delivery (Revit) Contract',
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

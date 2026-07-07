import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Negotiation } from '@/types/domain.ts'
import { validateNegotiationOfferTerms } from '@/domain/negotiation/validate-offer-terms.ts'

function negotiation(exchangeMode: string): Negotiation {
  return {
    id: 'neg-1',
    status: 'active',
    participants: [],
    commercialTerms: { exchangeMode },
  }
}

describe('validateNegotiationOfferTerms', () => {
  it('validates cash offer', () => {
    const errors = validateNegotiationOfferTerms(negotiation('cash'), {
      exchangeMode: 'cash',
      budget: 10000,
      paymentSchedule: 'Milestone',
      currency: 'SAR',
      amount: 10000,
    })
    assert.deepEqual(errors, [])
  })

  it('validates barter offer', () => {
    const errors = validateNegotiationOfferTerms(negotiation('barter'), {
      exchangeMode: 'barter',
      offeredService: 'PM consulting',
      requestedService: 'Design review',
      equivalenceEstimate: '40 hours',
      barterOffer: 'PM consulting',
      barterPreferences: 'Design review',
    })
    assert.deepEqual(errors, [])
  })

  it('validates equity offer', () => {
    const errors = validateNegotiationOfferTerms(negotiation('equity'), {
      exchangeMode: 'equity',
      equityPercentage: 10,
      ownershipTerms: '4-year vesting',
    })
    assert.deepEqual(errors, [])
  })

  it('validates profit-sharing offer', () => {
    const errors = validateNegotiationOfferTerms(negotiation('profit_sharing'), {
      exchangeMode: 'profit_sharing',
      profitSplit: '60/40',
      calculationBasis: 'net profit',
    })
    assert.deepEqual(errors, [])
  })

  it('validates hybrid offer', () => {
    const errors = validateNegotiationOfferTerms(negotiation('hybrid'), {
      exchangeMode: 'hybrid',
      cashComponent: 5000,
      nonCashComponent: 'Equity 5%',
      barterOffer: 'Advisory',
      barterPreferences: 'Marketing',
    })
    assert.deepEqual(errors, [])
  })

  it('rejects cash offer missing required fields', () => {
    const errors = validateNegotiationOfferTerms(negotiation('cash'), {
      exchangeMode: 'cash',
      currency: 'SAR',
    })
    assert.ok(errors.some((error) => error.includes('budget')))
  })
})

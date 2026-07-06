import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Opportunity } from '@/types/domain.ts'
import {
  buildCommercialTermsFromOpportunity,
  buildValueExchangeDraftPayload,
  formatCommercialTermsDisplayLines,
} from '@/domain/collaboration/value-exchange-lifecycle.ts'
import { looksLikeRawTaxonomyId } from '@/lib/collaboration-taxonomy-display.ts'

const baseOpportunity = (overrides: Partial<Opportunity> = {}): Opportunity => ({
  id: 'opp-1',
  title: 'Test opportunity',
  status: 'published',
  creatorId: 'user-1',
  ...overrides,
})

const exchangeModes = [
  'cash',
  'barter',
  'equity',
  'profit_sharing',
  'hybrid',
] as const

describe('value exchange lifecycle', () => {
  for (const mode of exchangeModes) {
    it(`extracts and displays commercial terms for ${mode}`, () => {
      const collaborationAttributes: Record<string, unknown> = {
        duration: '6 months',
      }

      if (mode === 'cash' || mode === 'hybrid') {
        collaborationAttributes.budgetRange = { min: 10000, max: 25000, currency: 'SAR' }
        collaborationAttributes.paymentSchedule = 'Milestone-based'
      }
      if (mode === 'barter' || mode === 'hybrid') {
        collaborationAttributes.barterOffer = 'Design services'
        collaborationAttributes.barterPreferences = 'Development support'
      }
      if (mode === 'equity' || mode === 'hybrid') {
        collaborationAttributes.equityPercentage = 15
        collaborationAttributes.ownershipTerms = 'Founder equity'
      }
      if (mode === 'profit_sharing' || mode === 'hybrid') {
        collaborationAttributes.profitSplit = '60/40'
        collaborationAttributes.calculationBasis = 'Net profit'
      }

      const opportunity = baseOpportunity({
        exchangeMode: mode,
        collaborationAttributes,
        exchangeData: buildValueExchangeDraftPayload({
          exchangeMode: mode,
          paymentModes: [mode],
          collaborationAttributes,
        }),
      })

      const terms = buildCommercialTermsFromOpportunity(opportunity)
      assert.equal(terms.exchangeMode, mode)

      const lines = formatCommercialTermsDisplayLines(terms)
      assert.ok(lines.length > 0)
      for (const line of lines) {
        assert.ok(!looksLikeRawTaxonomyId(line))
      }
      assert.ok(lines.some((line) => line.startsWith('Exchange:')))
    })
  }

  it('builds wizard exchange payload for hybrid mode', () => {
    const payload = buildValueExchangeDraftPayload({
      exchangeMode: 'hybrid',
      paymentModes: ['cash', 'barter', 'equity', 'profit_sharing'],
      collaborationAttributes: {
        cashComponent: 5000,
        barterComponent: 'Consulting days',
        equityComponent: 10,
        profitComponent: '20%',
      },
    })
    assert.equal(payload.exchangeMode, 'hybrid')
    assert.ok(Array.isArray(payload.accepted_modes))
  })
})

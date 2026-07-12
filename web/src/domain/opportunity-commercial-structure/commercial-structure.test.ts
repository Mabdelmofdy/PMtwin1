import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  deriveLegacyExchangeMode,
  deriveMatchingExchangeProfile,
  migrateLegacyExchangeModeToCommercialStructure,
  syncCommercialStructureDerivedFields,
  validateAllocation,
  validateCommercialStructureDraft,
  commercialStructureToProposedTerms,
  resolveAgreementCommercialTerms,
  createEmptyCommercialComponent,
  emptyCommercialStructure,
  type OpportunityCommercialStructure,
} from './index.ts'

describe('migrateLegacyExchangeModeToCommercialStructure', () => {
  it('migrates cash-only legacy exchangeMode', () => {
    const structure = migrateLegacyExchangeModeToCommercialStructure({
      exchangeMode: 'cash',
    })
    assert.equal(structure.components.length, 1)
    assert.equal(structure.components[0]!.type, 'cash')
    assert.equal(structure.components[0]!.enabled, true)
    assert.equal(structure.primaryMode, 'cash')
    assert.equal(deriveLegacyExchangeMode(structure), 'cash')
  })

  it('is idempotent across multiple loads', () => {
    const first = migrateLegacyExchangeModeToCommercialStructure({
      exchangeMode: 'cash',
      paymentModes: ['cash'],
    })
    const second = migrateLegacyExchangeModeToCommercialStructure({
      exchangeMode: 'cash',
      commercialStructure: first,
    })
    assert.equal(second.components.length, 1)
    assert.equal(second.components[0]!.id, first.components[0]!.id)
  })

  it('migrates hybrid payment modes into multiple components', () => {
    const structure = migrateLegacyExchangeModeToCommercialStructure({
      exchangeMode: 'hybrid',
      paymentModes: ['cash', 'profit_sharing'],
      commercialTerms: {
        budget: '2000000',
        currency: 'SAR',
        profitSharePercent: '15',
        hybridComponents: ['cash', 'profit_sharing'],
      },
    })
    assert.deepEqual(structure.components.map((c) => c.type).sort(), [
      'cash',
      'profit_sharing',
    ])
    assert.equal(deriveLegacyExchangeMode(structure), 'hybrid')
  })

  it('maps revenue_sharing alone to hybrid legacy mode', () => {
    const structure: OpportunityCommercialStructure = {
      components: [
        createEmptyCommercialComponent('revenue_sharing', 'cc-rev-1'),
      ],
    }
    assert.equal(deriveLegacyExchangeMode(structure), 'hybrid')
  })
})

describe('deriveMatchingExchangeProfile', () => {
  it('builds hybrid profile for cash + profit sharing', () => {
    let structure: OpportunityCommercialStructure = {
      components: [
        {
          ...createEmptyCommercialComponent('cash', 'c1'),
          allocationPercentage: 70,
        },
        {
          ...createEmptyCommercialComponent('profit_sharing', 'c2'),
          allocationPercentage: 30,
        },
      ],
      allocationMethod: 'percentage',
    }
    structure = syncCommercialStructureDerivedFields(structure)
    const profile = deriveMatchingExchangeProfile(structure)
    assert.equal(profile.isHybrid, true)
    assert.equal(profile.primaryMode, 'hybrid')
    assert.deepEqual(profile.modes, ['cash', 'profit_sharing'])
    assert.equal(profile.allocationSummary.length, 2)
  })
})

describe('allocation validation', () => {
  it('warns when percentage allocation is not 100', () => {
    const structure: OpportunityCommercialStructure = {
      components: [
        {
          ...createEmptyCommercialComponent('cash', 'c1'),
          allocationPercentage: 70,
        },
        {
          ...createEmptyCommercialComponent('equity', 'c2'),
          allocationPercentage: 20,
        },
      ],
      allocationMethod: 'percentage',
    }
    const issues = validateAllocation(structure)
    assert.ok(issues.some((i) => i.code === 'ALLOCATION_PERCENTAGE_TOTAL'))
  })

  it('does not force mixed allocation to 100%', () => {
    const structure: OpportunityCommercialStructure = {
      components: [
        {
          ...createEmptyCommercialComponent('cash', 'c1'),
          allocationAmount: { amount: 2_000_000, currency: 'SAR' },
        },
        {
          ...createEmptyCommercialComponent('equity', 'c2'),
          allocationPercentage: 5,
        },
      ],
      allocationMethod: 'mixed',
    }
    assert.equal(validateAllocation(structure).length, 0)
  })
})

describe('negotiation and agreement adapters', () => {
  it('copies commercial structure into proposed terms', () => {
    const structure: OpportunityCommercialStructure = {
      components: [
        {
          ...createEmptyCommercialComponent('cash', 'c1'),
          fixedAmount: 100_000,
          currency: 'SAR',
        },
      ],
    }
    const proposed = commercialStructureToProposedTerms(structure)
    assert.equal(proposed.amount, 100_000)
    assert.equal(proposed.commercialStructure?.components.length, 1)
    assert.deepEqual(proposed.sourceComponentIds, ['c1'])
  })

  it('keeps accepted offer as agreement authority', () => {
    const terms = resolveAgreementCommercialTerms({
      acceptedOfferTerms: {
        amount: 50_000,
        currency: 'SAR',
        exchangeMode: 'cash',
      },
      opportunityCommercialStructure: {
        components: [
          {
            ...createEmptyCommercialComponent('cash', 'c1'),
            fixedAmount: 100_000,
          },
        ],
      },
    })
    assert.equal(terms.amount, 50_000)
  })
})

describe('empty structure', () => {
  it('starts empty without components', () => {
    assert.deepEqual(emptyCommercialStructure().components, [])
    assert.deepEqual(
      validateCommercialStructureDraft(emptyCommercialStructure()),
      [],
    )
  })
})

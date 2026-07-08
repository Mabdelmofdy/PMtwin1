import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  EXCHANGE_MODE_KEYS,
  MAIN_COLLABORATION_MODEL_KEYS,
  MAIN_MODEL_REGISTRY,
  SUB_MODEL_REGISTRY,
  deriveMatchingTopology,
  isMatchTopologyValue,
  listSubModels,
  normalizeSubModelType,
  validateCollaborationTaxonomy,
  validateOpportunityCollaborationModel,
} from '../dist/index.js'

describe('collaboration-models registry completeness', () => {
  it('has all 5 main collaboration models', () => {
    assert.equal(MAIN_COLLABORATION_MODEL_KEYS.length, 5)
    for (const key of MAIN_COLLABORATION_MODEL_KEYS) {
      assert.ok(MAIN_MODEL_REGISTRY[key], `missing main model ${key}`)
    }
  })

  it('has all canonical sub-models with parent mapping and exchange/match rules', () => {
    const subs = listSubModels()
    assert.equal(subs.length, 13)
    for (const sub of subs) {
      assert.ok(sub.mainCollaborationModel, `${sub.key} missing mainCollaborationModel`)
      assert.ok(MAIN_MODEL_REGISTRY[sub.mainCollaborationModel], `${sub.key} parent invalid`)
      assert.ok(sub.allowedExchangeModes.length > 0, `${sub.key} missing exchange modes`)
      assert.ok(sub.allowedMatchTopologies.length > 0, `${sub.key} missing match topologies`)
      assert.ok(sub.modelType, `${sub.key} missing modelType`)
      assert.ok(SUB_MODEL_REGISTRY[sub.key], `${sub.key} not in registry`)
      assert.ok(sub.applicability, `${sub.key} missing applicability`)
      assert.ok(sub.applicability.supportedRelationships.length > 0, `${sub.key} missing supportedRelationships`)
      assert.ok(sub.applicability.ownershipPolicy, `${sub.key} missing ownershipPolicy`)
      assert.ok(sub.applicability.participantConstraints, `${sub.key} missing participantConstraints`)
    }
  })

  it('covers every exchange mode at least once', () => {
    const modes = new Set()
    for (const sub of listSubModels()) {
      for (const mode of sub.allowedExchangeModes) modes.add(mode)
    }
    for (const mode of EXCHANGE_MODE_KEYS) {
      assert.ok(modes.has(mode), `no sub-model allows exchange mode ${mode}`)
    }
  })
})

describe('wizard persistence guardrails', () => {
  it('rejects matching topology stored in subModelType (one_way / two_way / circular)', () => {
    for (const topology of ['one_way', 'two_way', 'circular']) {
      assert.ok(isMatchTopologyValue(topology))
      const result = validateCollaborationTaxonomy({
        mainCollaborationModel: 'cash_subcontracting',
        modelType: 'project_based',
        subModelType: topology,
        exchangeMode: 'cash',
      })
      assert.equal(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('subModelType')))
      assert.ok(
        result.errors.some((e) => e.includes('preferredMatchingTopology')),
        topology,
      )
    }
  })

  it('allows consortium as a JV sub-model key (not a free-standing topology pick)', () => {
    const result = validateCollaborationTaxonomy({
      mainCollaborationModel: 'joint_venture',
      modelType: 'project_based',
      subModelType: 'consortium',
      exchangeMode: 'cash',
    })
    assert.equal(result.valid, true, result.errors.join('; '))
    assert.equal(
      deriveMatchingTopology({
        mainCollaborationModel: 'joint_venture',
        subModelType: 'consortium',
      }).topology,
      'consortium',
    )
  })

  it('normalizes legacy seed aliases', () => {
    assert.equal(normalizeSubModelType('project'), 'task_based')
    assert.equal(normalizeSubModelType('shared_resources'), 'resource_sharing')
    assert.equal(
      normalizeSubModelType('joint_venture', { modelType: 'strategic_partnership' }),
      'strategic_jv',
    )
    assert.equal(normalizeSubModelType('one_way'), undefined)
  })
})

describe('matching topology derivation', () => {
  it('cash subcontracting → one_way', () => {
    assert.equal(
      deriveMatchingTopology({
        mainCollaborationModel: 'cash_subcontracting',
        modelType: 'project_based',
        subModelType: 'task_based',
        exchangeMode: 'cash',
      }).topology,
      'one_way',
    )
  })

  it('service exchange + barter → two_way', () => {
    assert.equal(
      deriveMatchingTopology({
        mainCollaborationModel: 'service_exchange',
        modelType: 'strategic_partnership',
        subModelType: 'strategic_alliance',
        exchangeMode: 'barter',
      }).topology,
      'two_way',
    )
  })

  it('joint venture sub-models → consortium', () => {
    for (const sub of ['consortium', 'project_jv', 'spv', 'strategic_jv']) {
      assert.equal(
        deriveMatchingTopology({
          mainCollaborationModel: 'joint_venture',
          subModelType: sub,
        }).topology,
        'consortium',
        sub,
      )
    }
  })

  it('resource sharing → one_way or circular', () => {
    const defaultTopology = deriveMatchingTopology({
      mainCollaborationModel: 'resource_sharing',
      subModelType: 'equipment_sharing',
      exchangeMode: 'cash',
    })
    assert.equal(defaultTopology.topology, 'one_way')

    const barterTopology = deriveMatchingTopology({
      mainCollaborationModel: 'resource_sharing',
      subModelType: 'resource_sharing',
      exchangeMode: 'barter',
      collaborationAttributes: { transactionType: 'Barter' },
    })
    assert.equal(barterTopology.topology, 'circular')
  })

  it('hiring → one_way', () => {
    assert.equal(
      deriveMatchingTopology({
        mainCollaborationModel: 'hiring',
        modelType: 'hiring',
        subModelType: 'professional_hiring',
      }).topology,
      'one_way',
    )
  })
})

describe('sub-model business validation', () => {
  it('validates task_based required attributes', () => {
    const invalid = validateOpportunityCollaborationModel({
      mainCollaborationModel: 'cash_subcontracting',
      modelType: 'project_based',
      subModelType: 'task_based',
      exchangeMode: 'cash',
      collaborationAttributes: {},
    })
    assert.equal(invalid.valid, false)
    assert.ok(invalid.errors.some((e) => e.includes('requiredSkills')))
  })

  it('accepts task_based with required attributes', () => {
    const valid = validateOpportunityCollaborationModel({
      mainCollaborationModel: 'cash_subcontracting',
      modelType: 'project_based',
      subModelType: 'task_based',
      exchangeMode: 'cash',
      collaborationAttributes: {
        detailedScope: 'Review shop drawings',
        requiredSkills: ['Structural'],
        duration: 30,
        startDate: '2026-08-01',
      },
    })
    assert.equal(valid.valid, true)
  })

  it('rejects ineligible owner party type when context provided', () => {
    const invalid = validateOpportunityCollaborationModel(
      {
        mainCollaborationModel: 'joint_venture',
        modelType: 'project_based',
        subModelType: 'project_jv',
        exchangeMode: 'equity',
        collaborationAttributes: {
          partnerRoles: ['Lead'],
          equitySplit: [{ partner: 'A', percentage: 50 }, { partner: 'B', percentage: 50 }],
          capitalContribution: 1000000,
          profitDistribution: [{ partner: 'A', percentage: 50 }, { partner: 'B', percentage: 50 }],
        },
      },
      { ownerPartyType: 'individual' },
    )
    assert.equal(invalid.valid, false)
    assert.ok(invalid.errors.some((e) => e.includes('company')))
  })

  it('keeps validation unchanged when party context omitted', () => {
    const valid = validateOpportunityCollaborationModel({
      mainCollaborationModel: 'joint_venture',
      modelType: 'project_based',
      subModelType: 'project_jv',
      exchangeMode: 'equity',
      collaborationAttributes: {
        partnerRoles: ['Lead'],
        equitySplit: [{ partner: 'A', percentage: 50 }, { partner: 'B', percentage: 50 }],
        capitalContribution: 1000000,
        profitDistribution: [{ partner: 'A', percentage: 50 }, { partner: 'B', percentage: 50 }],
      },
    })
    assert.equal(valid.valid, true)
  })
})

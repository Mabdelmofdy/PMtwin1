import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  isMatchTopologyValue,
  normalizeSubModelType,
  validateCollaborationTaxonomy,
} from '@pm-twin/collaboration-models'
import { buildOpportunityCollaborationPatch } from '@/domain/collaboration/opportunity-collaboration.ts'
import { loadOpportunities } from '@/infrastructure/seed/seed-loader.ts'

describe('opportunity collaboration wizard persistence', () => {
  it('never stores matching topology in subModelType patch', () => {
    for (const topology of ['one_way', 'two_way', 'circular']) {
      const patch = buildOpportunityCollaborationPatch({
        mainCollaborationModel: 'cash_subcontracting',
        modelType: 'project_based',
        subModelType: topology,
        exchangeMode: 'cash',
      })
      assert.notEqual(patch.subModelType, topology)
      assert.ok(patch.preferredMatchingTopology)
      assert.ok(!isMatchTopologyValue(patch.subModelType))
    }
  })

  it('builds canonical collaboration fields for task_based', () => {
    const patch = buildOpportunityCollaborationPatch({
      mainCollaborationModel: 'cash_subcontracting',
      modelType: 'project_based',
      subModelType: 'task_based',
      exchangeMode: 'cash',
      acceptedExchangeModes: ['cash'],
    })
    assert.equal(patch.subModelType, 'task_based')
    assert.equal(patch.mainCollaborationModel, 'cash_subcontracting')
    assert.equal(patch.preferredMatchingTopology, 'one_way')
  })

  it('ignores manual preferredMatchingTopology override — always system-derived', () => {
    const serviceBarter = buildOpportunityCollaborationPatch({
      mainCollaborationModel: 'service_exchange',
      modelType: 'strategic_partnership',
      subModelType: 'strategic_alliance',
      exchangeMode: 'barter',
      preferredMatchingTopology: 'one_way',
    })
    assert.equal(serviceBarter.preferredMatchingTopology, 'two_way')

    const jv = buildOpportunityCollaborationPatch({
      mainCollaborationModel: 'joint_venture',
      modelType: 'project_based',
      subModelType: 'project_jv',
      exchangeMode: 'equity',
      preferredMatchingTopology: 'one_way',
    })
    assert.equal(jv.preferredMatchingTopology, 'consortium')

    const resourceBarter = buildOpportunityCollaborationPatch({
      mainCollaborationModel: 'resource_sharing',
      modelType: 'resource_pooling',
      subModelType: 'resource_sharing',
      exchangeMode: 'barter',
      collaborationAttributes: { transactionType: 'barter' },
      preferredMatchingTopology: 'two_way',
    })
    assert.equal(resourceBarter.preferredMatchingTopology, 'circular')
  })
})

describe('seed opportunity collaboration normalization', () => {
  it('normalizes legacy subModelType values at load', () => {
    const invalid = loadOpportunities().filter((opp) => {
      const sub = opp.subModelType ?? ''
      return isMatchTopologyValue(sub)
    })
    assert.equal(invalid.length, 0, `topology in subModelType: ${invalid.map((o) => o.id).join(', ')}`)
  })

  it('resolves all opportunities against registry taxonomy', () => {
    const unresolved = loadOpportunities().filter((opp) => {
      if (!opp.subModelType || !opp.modelType) return true
      const result = validateCollaborationTaxonomy({
        mainCollaborationModel: opp.mainCollaborationModel,
        modelType: opp.modelType,
        subModelType: opp.subModelType,
        exchangeMode: opp.exchangeMode ?? 'cash',
        acceptedExchangeModes: opp.acceptedExchangeModes ?? opp.paymentModes,
      })
      return !result.valid
    })
    assert.equal(
      unresolved.length,
      0,
      `invalid taxonomy: ${unresolved.map((o) => `${o.id}:${o.subModelType}:${o.exchangeMode}`).join(', ')}`,
    )
  })

  it('maps legacy project alias to task_based', () => {
    assert.equal(normalizeSubModelType('project'), 'task_based')
  })
})

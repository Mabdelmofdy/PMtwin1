import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getSubModel, SUB_MODEL_TYPE_KEYS } from '@pm-twin/collaboration-models'
import {
  formatCollaborationExchangeMode,
  looksLikeRawTaxonomyId,
  resolveOpportunityTaxonomyLabels,
  resolvePostMatchTopologyLabel,
} from '@/lib/collaboration-taxonomy-display.ts'

describe('collaboration taxonomy display', () => {
  it('formats exchange modes without raw slugs', () => {
    assert.equal(formatCollaborationExchangeMode('cash'), 'Cash')
    assert.equal(formatCollaborationExchangeMode('profit_sharing'), 'Profit-Sharing')
    assert.equal(formatCollaborationExchangeMode('hybrid'), 'Hybrid')
    assert.ok(!looksLikeRawTaxonomyId(formatCollaborationExchangeMode('barter')))
  })

  it('resolves opportunity labels from registry', () => {
    const labels = resolveOpportunityTaxonomyLabels({
      mainCollaborationModel: 'cash_subcontracting',
      modelType: 'project_based',
      subModelType: 'task_based',
      exchangeMode: 'cash',
      preferredMatchingTopology: 'one_way',
    })
    assert.ok(labels.mainModel.length > 0)
    assert.ok(labels.subModel.length > 0)
    assert.equal(labels.exchangeMode, 'Cash')
    assert.equal(labels.matchingTopology, 'One Way Matching')
    assert.ok(!looksLikeRawTaxonomyId(labels.subModel))
    assert.ok(!looksLikeRawTaxonomyId(labels.exchangeMode))
  })

  it('resolves post-match topology labels', () => {
    assert.equal(resolvePostMatchTopologyLabel({ matchType: 'two_way' }), 'Two-Way Dependency')
    assert.ok(!looksLikeRawTaxonomyId(resolvePostMatchTopologyLabel({ matchType: 'circular' })))
  })

  it('registry sub-models expose human labels distinct from keys', () => {
    for (const key of SUB_MODEL_TYPE_KEYS) {
      const sub = getSubModel(key)
      assert.ok(sub)
      assert.ok(sub.name.length > 0)
      assert.notEqual(sub.name, key)
    }
  })
})

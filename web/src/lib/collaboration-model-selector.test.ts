import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  recommendCollaborationModels,
  isWizardComplete,
  type CollaborationWizardAnswers,
} from '@/lib/collaboration-model-selector'

describe('collaboration model selector', () => {
  it('returns empty when no answers provided', () => {
    const answers: CollaborationWizardAnswers = {
      exchangePreference: '',
      engagementScope: '',
      priority: '',
    }
    assert.deepEqual(recommendCollaborationModels(answers), [])
    assert.equal(isWizardComplete(answers), false)
  })

  it('recommends cash subcontracting for cash + defined package', () => {
    const answers: CollaborationWizardAnswers = {
      exchangePreference: 'cash',
      engagementScope: 'defined_package',
      priority: 'payment_clarity',
    }
    const results = recommendCollaborationModels(answers)
    assert.ok(results.length > 0)
    assert.equal(results[0]?.id, 'cash_subcontracting')
    assert.equal(isWizardComplete(answers), true)
  })

  it('recommends service exchange for barter preferences', () => {
    const results = recommendCollaborationModels({
      exchangePreference: 'barter',
      engagementScope: 'swap',
      priority: 'liquidity',
    })
    assert.equal(results[0]?.id, 'service_exchange')
  })

  it('recommends joint venture for partnership scope', () => {
    const results = recommendCollaborationModels({
      exchangePreference: 'partnership',
      engagementScope: 'multi_party',
      priority: 'governance',
    })
    assert.equal(results[0]?.id, 'joint_venture')
  })

  it('recommends resource sharing for pooling answers', () => {
    const results = recommendCollaborationModels({
      exchangePreference: 'pooling',
      engagementScope: 'capacity',
      priority: 'utilization',
    })
    assert.equal(results[0]?.id, 'resource_sharing')
  })

  it('can return multiple models when scores tie', () => {
    const results = recommendCollaborationModels({
      exchangePreference: 'cash',
      engagementScope: 'swap',
      priority: 'liquidity',
    })
    assert.ok(results.length >= 2)
  })
})

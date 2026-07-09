import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { evaluateProfileReadiness } from '@/domain/profile-readiness/profile-readiness-evaluator.ts'
import { buildProfileExplanation } from '@/services/explainability/explainability-service.ts'
import { isExplanationBundle } from '@pm-twin/explainability'

describe('ExplanationPanel data contract', () => {
  it('profile bundle exposes sections consumed by ExplanationPanel', () => {
    const result = evaluateProfileReadiness({
      profileKind: 'individual',
      profile: { name: 'Sara', title: 'PM' },
    })
    const bundle = buildProfileExplanation('user-panel', 'individual', result, {
      name: 'Sara',
      title: 'PM',
    })

    assert.equal(isExplanationBundle(bundle), true)
    assert.ok(bundle.summary.length > 0)
    assert.ok(Array.isArray(bundle.recommendations))
    assert.ok(Array.isArray(bundle.blockers))
    assert.ok(Array.isArray(bundle.scoreBreakdown))
    assert.ok(Array.isArray(bundle.timeline))
    assert.ok(bundle.health.length > 0)
  })
})

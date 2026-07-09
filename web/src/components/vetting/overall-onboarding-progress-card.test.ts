import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('overall onboarding progress card source', () => {
  it('shows stage indicator and steps remaining without duplicate primary action', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/vetting/overall-onboarding-progress-card.tsx'),
      'utf8',
    )
    assert.equal(source.includes('Stage'), true)
    assert.equal(source.includes('/ {totalStages}'), true)
    assert.equal(source.includes('Steps Remaining'), true)
    assert.equal(source.includes('Next best action'), false)
    assert.equal(source.includes('UI-only progress'), false)
    assert.equal(source.includes('ReadinessScoreRing'), true)
  })
})

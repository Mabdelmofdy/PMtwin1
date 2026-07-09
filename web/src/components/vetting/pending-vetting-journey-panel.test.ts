import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('pending vetting journey panel source', () => {
  it('renders account progress with journey-linked primary action', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/vetting/pending-vetting-journey-panel.tsx'),
      'utf8',
    )
    assert.equal(source.includes('buildVettingWorkflowSteps'), true)
    assert.equal(source.includes('title="Account progress"'), true)
    assert.equal(source.includes('aria-label="Account progress journey"'), true)
    assert.equal(source.includes('actionQueue.primary.stepId'), true)
    assert.equal(source.includes('primary onboarding action'), true)
    assert.equal(source.includes('{label}: {state}'), false)
  })
})

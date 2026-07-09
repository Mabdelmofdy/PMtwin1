import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('pending vetting dashboard source', () => {
  it('renders journey and overall onboarding cards', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/vetting/pending-vetting-dashboard.tsx'),
      'utf8',
    )
    assert.equal(source.includes('OverallOnboardingProgressCard'), true)
    assert.equal(source.includes('PendingVettingJourneyPanel'), true)
    assert.equal(source.includes('stepsRemaining={journey.stepsRemaining}'), true)
    assert.equal(source.includes('nextBestAction={journey.nextBestAction}'), true)
  })

  it('supports deterministic next-action links', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/vetting/pending-vetting-dashboard.tsx'),
      'utf8',
    )
    assert.equal(source.includes('function resolveActionLink(action: string)'), true)
    assert.equal(source.includes("label: 'Upload documents'"), true)
    assert.equal(source.includes("label: 'Open profile'"), true)
    assert.equal(source.includes("label: 'Resubmit for review'"), true)
  })
})

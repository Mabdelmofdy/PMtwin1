import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('overall onboarding progress card source', () => {
  it('documents UI-only behavior and onboarding composition', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/vetting/overall-onboarding-progress-card.tsx'),
      'utf8',
    )
    assert.equal(
      source.includes('UI-only progress — not used for permissions or business logic.'),
      true,
    )
    assert.equal(source.includes('Steps remaining:'), true)
    assert.equal(source.includes('Next best action:'), true)
  })
})

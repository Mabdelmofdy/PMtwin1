import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('pending vetting journey panel source', () => {
  it('maps blocked/completed/current/pending states for journey rendering', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/vetting/pending-vetting-journey-panel.tsx'),
      'utf8',
    )
    assert.equal(source.includes("if (state === 'completed') return 'complete'"), true)
    assert.equal(source.includes("if (state === 'current') return 'current'"), true)
    assert.equal(source.includes("step.state === 'blocked'"), true)
    assert.equal(source.includes('PmWorkflowJourney'), true)
  })
})

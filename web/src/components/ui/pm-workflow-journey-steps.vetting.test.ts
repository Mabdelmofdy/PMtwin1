import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('buildVettingWorkflowSteps source', () => {
  it('defines vetting workflow builder with clickable hrefs for all steps', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/ui/pm-workflow-journey-steps.ts'),
      'utf8',
    )
    assert.equal(source.includes('export function buildVettingWorkflowSteps'), true)
    assert.equal(source.includes("return '/profile'"), true)
    assert.equal(source.includes("return '/party-documents'"), true)
    assert.equal(source.includes("return '/dashboard#vetting-review'"), true)
    assert.equal(source.includes('step.href ?? resolveVettingStepHref(step.id)'), true)
  })
})

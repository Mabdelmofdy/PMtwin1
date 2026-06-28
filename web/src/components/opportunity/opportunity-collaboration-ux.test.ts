import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  COLLABORATION_FLOW_STEPS,
} from '@/components/opportunity/collaboration-flow-strip.tsx'
import {
  APPLICATIONS_LEGACY_EMPTY_MESSAGE,
  APPLICATIONS_LEGACY_SECTION_TITLE,
} from '@/components/opportunity/applications-panel.tsx'

describe('collaboration flow UX constants', () => {
  it('defines canonical collaboration steps in order', () => {
    assert.deepEqual([...COLLABORATION_FLOW_STEPS], [
      'Opportunity',
      'PostMatch',
      'Negotiation',
      'Deal',
      'Contract',
    ])
  })

  it('labels applications as legacy and points to PostMatches', () => {
    assert.match(APPLICATIONS_LEGACY_SECTION_TITLE, /legacy/i)
    assert.match(APPLICATIONS_LEGACY_EMPTY_MESSAGE, /PostMatch/i)
  })
})

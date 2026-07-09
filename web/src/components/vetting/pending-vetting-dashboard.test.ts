import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('pending vetting dashboard source', () => {
  it('composes journey-linked layout with provider and reassurance section', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/vetting/pending-vetting-dashboard.tsx'),
      'utf8',
    )
    assert.equal(source.includes('PmDashboardLayout'), true)
    assert.equal(source.includes('PmPageHeader'), true)
    assert.equal(source.includes('PmPageHeroMetric'), true)
    assert.equal(source.includes('PmStatsStrip'), true)
    assert.equal(source.includes('PendingVettingJourneyPanel'), true)
    assert.equal(source.includes('VettingDocumentsProgressCard'), true)
    assert.equal(source.includes('PendingVettingSecondaryActions'), true)
    assert.equal(source.includes('PendingVettingWhatHappensNext'), true)
    assert.equal(source.includes('resolveVettingActionQueue'), true)
    assert.equal(source.includes('space-y-6'), true)
    assert.equal(source.includes('id="vetting-review"'), true)
    assert.equal(source.includes('role="status"'), true)
    assert.equal(source.includes('PmActionHub'), false)
    assert.equal(source.includes('Good morning'), false)
  })
})

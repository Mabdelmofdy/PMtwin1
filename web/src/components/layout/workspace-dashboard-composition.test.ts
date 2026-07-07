import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), 'workspace-dashboard-composition.tsx')
const source = readFileSync(sourcePath, 'utf8')

describe('WorkspaceDashboardComposition intelligence contract', () => {
  it('shows executive intelligence snapshot section', () => {
    assert.match(source, /Executive intelligence snapshot/)
    assert.match(source, /\/intelligence\/portfolio/)
    assert.match(source, /\/intelligence\/funnel/)
    assert.match(source, /\/intelligence\/risk/)
    assert.match(source, /\/intelligence\/execution/)
  })

  it('uses canonical analytics builders for dashboard KPIs', () => {
    assert.match(source, /buildReadinessAnalytics/)
    assert.match(source, /buildMatchingQualityAnalytics/)
  })
})

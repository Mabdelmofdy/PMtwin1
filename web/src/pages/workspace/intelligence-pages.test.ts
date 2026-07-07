import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), 'intelligence-pages.tsx')
const source = readFileSync(sourcePath, 'utf8')
const routesPath = join(dirname(fileURLToPath(import.meta.url)), '../../routes.tsx')
const routesSource = readFileSync(routesPath, 'utf8')

describe('Workspace intelligence pages', () => {
  it('provides four executive intelligence surfaces', () => {
    assert.match(source, /export function IntelligencePortfolioPage/)
    assert.match(source, /export function IntelligenceFunnelPage/)
    assert.match(source, /export function IntelligenceRiskPage/)
    assert.match(source, /export function IntelligenceExecutionPage/)
  })

  it('uses existing readiness and matching quality analytics builders', () => {
    assert.match(source, /buildReadinessAnalytics/)
    assert.match(source, /buildMatchingQualityAnalytics/)
    assert.match(source, /createCreatorProfileResolver/)
  })

  it('is wired into authenticated routes', () => {
    assert.match(routesSource, /\/intelligence\/portfolio/)
    assert.match(routesSource, /\/intelligence\/funnel/)
    assert.match(routesSource, /\/intelligence\/risk/)
    assert.match(routesSource, /\/intelligence\/execution/)
  })
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..')

function readSrc(relativePath: string): string {
  return readFileSync(path.join(root, 'src', relativePath), 'utf8')
}

describe('opportunity-detail-page Experience 4.0 contracts', () => {
  it('routes through OpportunityDetailsShell', () => {
    const page = readSrc('pages/workspace/opportunity-detail-page.tsx')
    assert.match(page, /OpportunityDetailsShell/)
    assert.doesNotMatch(page, /estimatedMatch/)
    assert.doesNotMatch(page, /validationPercent=\{Math\.max/)
  })

  it('shell uses workspace query navigation and central read model', () => {
    const shell = readSrc('components/opportunity/details/opportunity-details-shell.tsx')
    assert.match(shell, /buildOpportunityDetailsReadModel/)
    assert.match(shell, /useOpportunityWorkspace/)
    assert.match(shell, /OpportunityCommandCenter/)
    assert.match(shell, /lazy\(/)
  })

  it('does not invent marketplace engagement analytics', () => {
    const command = readSrc(
      'components/opportunity/details/sidebar/opportunity-command-center.tsx',
    )
    assert.match(command, /Marketplace analytics are not available/)
    assert.doesNotMatch(command, /viewCount|bookmarkCount|shareCount/)
  })
})

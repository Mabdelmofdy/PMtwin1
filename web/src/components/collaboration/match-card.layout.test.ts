import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const sourcePath = join(
  dirname(fileURLToPath(import.meta.url)),
  'match-card.tsx',
)
const source = readFileSync(sourcePath, 'utf8')

describe('MatchCard layout contract', () => {
  it('places match type in metadata row with date and status', () => {
    const metadataStart = source.indexOf('mt-3 flex flex-wrap items-center')
    assert.ok(metadataStart >= 0)

    const metadataBlock = source.slice(metadataStart, metadataStart + 400)
    assert.match(metadataBlock, /<MatchTypeChip matchType=\{match\.matchType\} \/>/)
    assert.match(metadataBlock, /formatDate\(match\.createdAt\)/)
    assert.match(metadataBlock, /<PmWorkflowBadge status=\{match\.status\}/)
  })

  it('exposes single primary Open match action', () => {
    assert.match(source, /primary=\{\{ label: 'Open match', href \}\}/)
  })

  it('supports optional shortened browse titles', () => {
    assert.match(source, /shortenTitles\?: boolean/)
    assert.match(source, /truncate\(pairing\.needTitle/)
    assert.match(source, /truncate\(pairing\.offerTitle/)
  })
})

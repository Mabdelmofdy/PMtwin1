import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const sourcePath = join(
  dirname(fileURLToPath(import.meta.url)),
  'matches-list-section.tsx',
)
const source = readFileSync(sourcePath, 'utf8')

describe('MatchesListSection layout contract', () => {
  it('supports card grid browse layout with responsive breakpoints', () => {
    assert.match(source, /layout\?: 'table' \| 'cards'/)
    assert.match(source, /data-slot="matches-list-cards"/)
    assert.match(source, /hidden gap-4 sm:grid md:grid-cols-2 xl:grid-cols-3/)
    assert.match(source, /space-y-3 sm:hidden/)
  })

  it('reuses MatchCard with Open match action in card grid', () => {
    const cardGridStart = source.indexOf('function MatchesListCardGrid')
    const cardGridEnd = source.indexOf('function MatchesListTable')
    assert.ok(cardGridStart >= 0 && cardGridEnd > cardGridStart)

    const cardGridSource = source.slice(cardGridStart, cardGridEnd)
    assert.match(cardGridSource, /<MatchCard match=\{match\}/)
    assert.match(cardGridSource, /shortenTitles=\{shortenTitles\}/)
    assert.doesNotMatch(cardGridSource, /<PmDataTable/)
  })

  it('keeps table layout for pipeline embed path', () => {
    const tableStart = source.indexOf('function MatchesListTable')
    assert.ok(tableStart >= 0)
    assert.match(source.slice(tableStart), /<PmDataTable/)
    assert.match(source.slice(tableStart), /renderMobileCard/)
  })
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const sourcePath = join(
  dirname(fileURLToPath(import.meta.url)),
  'pipeline-pages.tsx',
)
const source = readFileSync(sourcePath, 'utf8')

describe('MatchesPage browse layout contract', () => {
  it('uses PmBrowsePage with toolbar and pagination slots', () => {
    const fnStart = source.indexOf('export function MatchesPage')
    const fnEnd = source.indexOf('export function MatchDetailPage')
    assert.ok(fnStart >= 0 && fnEnd > fnStart)

    const matchesPageSource = source.slice(fnStart, fnEnd)
    assert.match(matchesPageSource, /<PmBrowsePage/)
    assert.match(matchesPageSource, /toolbar=\{[\s\S]*<PmBrowseToolbar/)
    assert.match(matchesPageSource, /pagination=\{/)
    assert.doesNotMatch(matchesPageSource, /<PmToolbarSurface/)
  })

  it('composes MatchesBrowseToolbar and external list filters in browse toolbar', () => {
    const fnStart = source.indexOf('export function MatchesPage')
    const fnEnd = source.indexOf('export function MatchDetailPage')
    const matchesPageSource = source.slice(fnStart, fnEnd)

    assert.match(matchesPageSource, /<MatchesBrowseToolbar/)
    assert.match(matchesPageSource, /useMatchesListFilters/)
    assert.match(matchesPageSource, /showToolbar=\{false\}/)
    assert.match(matchesPageSource, /showPagination=\{false\}/)
  })

  it('uses card grid layout for browse content instead of PmDataTable', () => {
    const fnStart = source.indexOf('export function MatchesPage')
    const fnEnd = source.indexOf('export function MatchDetailPage')
    const matchesPageSource = source.slice(fnStart, fnEnd)

    assert.match(matchesPageSource, /layout="cards"/)
    assert.match(matchesPageSource, /shortenTitles/)
    assert.doesNotMatch(matchesPageSource, /<PmDataTable/)
  })

  it('keeps MatchCard rendering in browse card grid', () => {
    const listSectionPath = join(
      dirname(fileURLToPath(import.meta.url)),
      '../../components/collaboration/matches-list-section.tsx',
    )
    const listSectionSource = readFileSync(listSectionPath, 'utf8')

    assert.match(listSectionSource, /function MatchesListCardGrid/)
    assert.match(listSectionSource, /<MatchCard match=\{match\}/)
    assert.match(listSectionSource, /md:grid-cols-2 xl:grid-cols-3/)
  })
})

describe('NegotiationsPage browse layout contract', () => {
  it('uses PmBrowsePage with toolbar and pagination slots', () => {
    const fnStart = source.indexOf('export function NegotiationsPage')
    const fnEnd = source.indexOf('export function NegotiationDetailPage')
    assert.ok(fnStart >= 0 && fnEnd > fnStart)

    const negotiationsPageSource = source.slice(fnStart, fnEnd)
    assert.match(negotiationsPageSource, /<PmBrowsePage/)
    assert.match(negotiationsPageSource, /toolbar=\{[\s\S]*<PmBrowseToolbar/)
    assert.match(negotiationsPageSource, /pagination=\{/)
    assert.doesNotMatch(negotiationsPageSource, /<PmToolbarSurface/)
    assert.doesNotMatch(negotiationsPageSource, /<PmPage[\s>]/)
  })

  it('uses unified list empty state helpers', () => {
    const fnStart = source.indexOf('export function NegotiationsPage')
    const fnEnd = source.indexOf('export function NegotiationDetailPage')
    const negotiationsPageSource = source.slice(fnStart, fnEnd)

    assert.match(negotiationsPageSource, /resolveListEmptyState/)
    assert.match(negotiationsPageSource, /<PmTableEmpty/)
    assert.match(negotiationsPageSource, /<PmEmptyState/)
  })

  it('keeps existing negotiation card grid in browse content', () => {
    const fnStart = source.indexOf('export function NegotiationsPage')
    const fnEnd = source.indexOf('export function NegotiationDetailPage')
    const negotiationsPageSource = source.slice(fnStart, fnEnd)

    assert.match(negotiationsPageSource, /grid gap-3 md:grid-cols-2/)
    assert.match(negotiationsPageSource, /Open negotiation/)
    assert.match(negotiationsPageSource, /<PmTablePagination/)
  })
})

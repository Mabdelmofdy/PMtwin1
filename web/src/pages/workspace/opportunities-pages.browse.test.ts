import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const sourcePath = join(
  dirname(fileURLToPath(import.meta.url)),
  'opportunities-pages.tsx',
)
const source = readFileSync(sourcePath, 'utf8')

describe('OpportunitiesPage browse layout contract', () => {
  it('uses PmBrowsePage with toolbar and pagination slots', () => {
    const fnStart = source.indexOf('export function OpportunitiesPage')
    const fnEnd = source.indexOf('export function OpportunityMapPage')
    assert.ok(fnStart >= 0 && fnEnd > fnStart)

    const opportunitiesPageSource = source.slice(fnStart, fnEnd)
    assert.match(opportunitiesPageSource, /<PmBrowsePage/)
    assert.match(opportunitiesPageSource, /toolbar=\{[\s\S]*<PmBrowseToolbar/)
    assert.match(opportunitiesPageSource, /pagination=\{/)
    assert.doesNotMatch(opportunitiesPageSource, /<PmToolbarSurface/)
  })

  it('keeps OpportunityCard grid content in browse children', () => {
    assert.match(source, /<OpportunityCard/)
    assert.match(source, /md:grid-cols-2 xl:grid-cols-3/)
  })
})

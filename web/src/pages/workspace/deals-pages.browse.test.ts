import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const sourcePath = join(
  dirname(fileURLToPath(import.meta.url)),
  'deals-pages.tsx',
)
const source = readFileSync(sourcePath, 'utf8')

describe('DealsPage browse layout contract', () => {
  it('uses PmBrowsePage with toolbar and pagination slots', () => {
    const fnStart = source.indexOf('export function DealsPage')
    const fnEnd = source.indexOf('export function DealDetailPage')
    assert.ok(fnStart >= 0 && fnEnd > fnStart)

    const dealsPageSource = source.slice(fnStart, fnEnd)
    assert.match(dealsPageSource, /<PmBrowsePage/)
    assert.match(dealsPageSource, /toolbar=\{[\s\S]*<PmBrowseToolbar/)
    assert.match(dealsPageSource, /pagination=\{/)
    assert.doesNotMatch(dealsPageSource, /<PmToolbarSurface/)
    assert.doesNotMatch(dealsPageSource, /<PmPage[\s>]/)
  })

  it('keeps PmDataTable with search in browse toolbar', () => {
    const fnStart = source.indexOf('export function DealsPage')
    const fnEnd = source.indexOf('export function DealDetailPage')
    const dealsPageSource = source.slice(fnStart, fnEnd)

    assert.match(dealsPageSource, /<PmTableToolbar/)
    assert.match(dealsPageSource, /<PmTableSearch/)
    assert.match(dealsPageSource, /<PmDataTable/)
    assert.match(dealsPageSource, /resolveListEmptyState/)
  })

  it('keeps row actions and mobile DealListCard navigation', () => {
    const fnStart = source.indexOf('export function DealsPage')
    const fnEnd = source.indexOf('export function DealDetailPage')
    const dealsPageSource = source.slice(fnStart, fnEnd)

    assert.match(dealsPageSource, /<PmTableRowActions/)
    assert.match(dealsPageSource, /navigate\(`\/deals\/\$\{d\.id\}`\)/)
    assert.match(dealsPageSource, /renderMobileCard=\{\(d\) => <DealListCard deal=\{d\} \/>/)
    assert.match(source, /function DealListCard/)
    assert.match(source, /href=\{`\/deals\/\$\{deal\.id\}`\}/)
  })
})

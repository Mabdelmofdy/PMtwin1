import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const sourcePath = join(
  dirname(fileURLToPath(import.meta.url)),
  'contracts-pages.tsx',
)
const source = readFileSync(sourcePath, 'utf8')

describe('ContractsPage browse layout contract', () => {
  it('uses PmBrowsePage with toolbar and pagination slots', () => {
    const fnStart = source.indexOf('export function ContractsPage')
    const fnEnd = source.indexOf('export function ContractDetailPage')
    assert.ok(fnStart >= 0 && fnEnd > fnStart)

    const contractsPageSource = source.slice(fnStart, fnEnd)
    assert.match(contractsPageSource, /<PmBrowsePage/)
    assert.match(contractsPageSource, /toolbar=\{[\s\S]*<PmBrowseToolbar/)
    assert.match(contractsPageSource, /pagination=\{/)
    assert.doesNotMatch(contractsPageSource, /<PmToolbarSurface/)
    assert.doesNotMatch(contractsPageSource, /<PmPage[\s>]/)
  })

  it('keeps PmDataTable with search in browse toolbar', () => {
    const fnStart = source.indexOf('export function ContractsPage')
    const fnEnd = source.indexOf('export function ContractDetailPage')
    const contractsPageSource = source.slice(fnStart, fnEnd)

    assert.match(contractsPageSource, /<PmTableToolbar/)
    assert.match(contractsPageSource, /<PmTableSearch/)
    assert.match(contractsPageSource, /<PmDataTable/)
    assert.match(contractsPageSource, /resolveListEmptyState/)
    assert.match(contractsPageSource, /useExecutiveListFilters/)
    assert.match(contractsPageSource, /PmFilterChips/)
  })

  it('keeps row actions and mobile ContractListCard navigation', () => {
    const fnStart = source.indexOf('export function ContractsPage')
    const fnEnd = source.indexOf('export function ContractDetailPage')
    const contractsPageSource = source.slice(fnStart, fnEnd)

    assert.match(contractsPageSource, /<PmTableRowActions/)
    assert.match(contractsPageSource, /navigate\(`\/contracts\/\$\{c\.id\}`\)/)
    assert.match(contractsPageSource, /renderMobileCard=\{\(c\) => <ContractListCard contract=\{c\} \/>/)
    assert.match(source, /function ContractListCard/)
    assert.match(source, /href=\{`\/contracts\/\$\{contract\.id\}`\}/)
    assert.match(source, /ExecutiveEntityMetadata/)
  })
})

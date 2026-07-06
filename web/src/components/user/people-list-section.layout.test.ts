import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const sourcePath = join(
  dirname(fileURLToPath(import.meta.url)),
  'people-list-section.tsx',
)
const source = readFileSync(sourcePath, 'utf8')

describe('PeopleListSection layout contract', () => {
  it('exports browse toolbar and filter hook for PmBrowsePage composition', () => {
    assert.match(source, /export function usePeopleListFilters/)
    assert.match(source, /export function PeopleBrowseToolbar/)
    assert.match(source, /export function PeopleListSection/)
  })

  it('keeps profile navigation in table and row actions', () => {
    const tableStart = source.indexOf('function PeopleListTable')
    assert.ok(tableStart >= 0)

    const tableSource = source.slice(tableStart)
    assert.match(tableSource, /to=\{\`\/people\/\$\{person\.id\}\`\}/)
    assert.match(tableSource, /navigate\(`\/people\/\$\{person\.id\}`\)/)
    assert.match(tableSource, /<PmDataTable/)
  })

  it('uses unified list empty state helpers', () => {
    assert.match(source, /resolveListEmptyState/)
    assert.match(source, /function PeopleListEmpty/)
    assert.match(source, /<PmEmptyState/)
    assert.match(source, /<PmTableEmpty/)
  })
})

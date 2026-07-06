import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const sourcePath = join(
  dirname(fileURLToPath(import.meta.url)),
  'notifications-list-section.tsx',
)
const source = readFileSync(sourcePath, 'utf8')

describe('NotificationsListSection layout contract', () => {
  it('exports browse toolbar and filter hook for PmBrowsePage composition', () => {
    assert.match(source, /export function useNotificationsListFilters/)
    assert.match(source, /export function NotificationsBrowseToolbar/)
    assert.match(source, /export function NotificationsListSection/)
  })

  it('keeps desktop table and grouped mobile notification list', () => {
    const contentStart = source.indexOf('function NotificationsListContent')
    assert.ok(contentStart >= 0)

    const contentSource = source.slice(contentStart)
    assert.match(contentSource, /<PmDataTable/)
    assert.match(contentSource, /<PmContentCard key=\{group\.key\}/)
    assert.match(contentSource, /to=\{n\.link \?\? '\/notifications'\}/)
  })

  it('uses unified list empty state helpers', () => {
    assert.match(source, /resolveListEmptyState/)
    assert.match(source, /function NotificationsListEmpty/)
    assert.match(source, /<PmEmptyState/)
    assert.match(source, /<PmTableEmpty/)
  })
})

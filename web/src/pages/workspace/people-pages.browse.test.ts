import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const sourcePath = join(
  dirname(fileURLToPath(import.meta.url)),
  'people-pages.tsx',
)
const source = readFileSync(sourcePath, 'utf8')

describe('PeoplePage browse layout contract', () => {
  it('uses PmBrowsePage with toolbar and pagination slots', () => {
    const fnStart = source.indexOf('export function PeoplePage')
    const fnEnd = source.indexOf('export function PersonProfilePage')
    assert.ok(fnStart >= 0 && fnEnd > fnStart)

    const peoplePageSource = source.slice(fnStart, fnEnd)
    assert.match(peoplePageSource, /<PmBrowsePage/)
    assert.match(peoplePageSource, /toolbar=\{[\s\S]*<PmBrowseToolbar/)
    assert.match(peoplePageSource, /pagination=\{/)
    assert.doesNotMatch(peoplePageSource, /<PmToolbarSurface/)
    assert.doesNotMatch(peoplePageSource, /<PmPage[\s>]/)
  })

  it('composes PeopleBrowseToolbar and external list filters in browse toolbar', () => {
    const fnStart = source.indexOf('export function PeoplePage')
    const fnEnd = source.indexOf('export function PersonProfilePage')
    const peoplePageSource = source.slice(fnStart, fnEnd)

    assert.match(peoplePageSource, /<PeopleBrowseToolbar/)
    assert.match(peoplePageSource, /usePeopleListFilters/)
    assert.match(peoplePageSource, /showToolbar=\{false\}/)
    assert.match(peoplePageSource, /showPagination=\{false\}/)
  })

  it('keeps PersonCard mobile rendering via PeopleListSection', () => {
    const listSectionPath = join(
      dirname(fileURLToPath(import.meta.url)),
      '../../components/user/people-list-section.tsx',
    )
    const listSectionSource = readFileSync(listSectionPath, 'utf8')

    assert.match(source, /<PeopleListSection/)
    assert.match(listSectionSource, /renderMobileCard/)
    assert.match(listSectionSource, /<PersonCard person=\{person\} companyIds=\{companyIds\} \/>/)
    assert.match(listSectionSource, /resolveListEmptyState/)
  })
})

describe('NotificationsPage browse layout contract', () => {
  it('uses PmBrowsePage with toolbar and pagination slots', () => {
    const fnStart = source.indexOf('export function NotificationsPage')
    const fnEnd = source.indexOf('export function ProfilePage')
    assert.ok(fnStart >= 0 && fnEnd > fnStart)

    const notificationsPageSource = source.slice(fnStart, fnEnd)
    assert.match(notificationsPageSource, /<PmBrowsePage/)
    assert.match(notificationsPageSource, /toolbar=\{[\s\S]*<PmBrowseToolbar/)
    assert.match(notificationsPageSource, /pagination=\{/)
    assert.doesNotMatch(notificationsPageSource, /<PmToolbarSurface/)
    assert.doesNotMatch(notificationsPageSource, /<PmPage[\s>]/)
  })

  it('composes NotificationsBrowseToolbar and external list filters in browse toolbar', () => {
    const fnStart = source.indexOf('export function NotificationsPage')
    const fnEnd = source.indexOf('export function ProfilePage')
    const notificationsPageSource = source.slice(fnStart, fnEnd)

    assert.match(notificationsPageSource, /<NotificationsBrowseToolbar/)
    assert.match(notificationsPageSource, /useNotificationsListFilters/)
    assert.match(notificationsPageSource, /showToolbar=\{false\}/)
    assert.match(notificationsPageSource, /showPagination=\{false\}/)
  })

  it('keeps grouped mobile list and desktop table in NotificationsListSection', () => {
    const listSectionPath = join(
      dirname(fileURLToPath(import.meta.url)),
      '../../components/user/notifications-list-section.tsx',
    )
    const listSectionSource = readFileSync(listSectionPath, 'utf8')

    assert.match(source, /<NotificationsListSection/)
    assert.match(listSectionSource, /hidden lg:block/)
    assert.match(listSectionSource, /space-y-4 lg:hidden/)
    assert.match(listSectionSource, /groupNotifications/)
    assert.match(listSectionSource, /resolveListEmptyState/)
  })
})

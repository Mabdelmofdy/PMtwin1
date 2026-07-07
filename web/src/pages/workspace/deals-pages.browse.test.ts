import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const sourcePath = join(
  dirname(fileURLToPath(import.meta.url)),
  'commercial-agreements-pages.tsx',
)
const source = readFileSync(sourcePath, 'utf8')

describe('CommercialAgreementsPage browse layout contract', () => {
  it('uses PmBrowsePage with toolbar and pagination slots', () => {
    const fnStart = source.indexOf('export function CommercialAgreementsPage')
    const fnEnd = source.indexOf('export function CommercialAgreementDetailPage')
    assert.ok(fnStart >= 0 && fnEnd > fnStart)

    const pageSource = source.slice(fnStart, fnEnd)
    assert.match(pageSource, /<PmBrowsePage/)
    assert.match(pageSource, /toolbar=\{[\s\S]*<PmBrowseToolbar/)
    assert.match(pageSource, /pagination=\{/)
    assert.doesNotMatch(pageSource, /<PmToolbarSurface/)
    assert.doesNotMatch(pageSource, /<PmPage[\s>]/)
  })

  it('keeps PmDataTable with search in browse toolbar', () => {
    const fnStart = source.indexOf('export function CommercialAgreementsPage')
    const fnEnd = source.indexOf('export function CommercialAgreementDetailPage')
    const pageSource = source.slice(fnStart, fnEnd)

    assert.match(pageSource, /<PmTableToolbar/)
    assert.match(pageSource, /<PmTableSearch/)
    assert.match(pageSource, /<PmDataTable/)
    assert.match(pageSource, /resolveListEmptyState/)
  })

  it('keeps row actions and mobile list card navigation', () => {
    const fnStart = source.indexOf('export function CommercialAgreementsPage')
    const fnEnd = source.indexOf('export function CommercialAgreementDetailPage')
    const pageSource = source.slice(fnStart, fnEnd)

    assert.match(pageSource, /<PmTableRowActions/)
    assert.match(pageSource, /navigate\(`\/commercial-agreements\/\$\{d\.id\}`\)/)
    assert.match(
      pageSource,
      /renderMobileCard=\{\(d\) => <CommercialAgreementListCard commercialAgreement=\{d\} \/>}/,
    )
    assert.match(source, /function CommercialAgreementListCard/)
    assert.match(source, /href=\{`\/commercial-agreements\/\$\{commercialAgreement\.id\}`\}/)
  })
})

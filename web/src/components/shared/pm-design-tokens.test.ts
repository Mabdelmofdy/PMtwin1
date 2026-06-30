import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  formatMatchTypeLabel,
  pmLayout,
  pmMotion,
  pmTypography,
  resolveMatchTypeStyle,
} from '@/components/shared/pm-design-tokens.ts'

describe('pm-design-tokens', () => {
  it('exposes stable typography class names', () => {
    assert.equal(pmTypography.h1, 'pm-text-h1')
    assert.equal(pmTypography.mono, 'pm-text-mono')
  })

  it('exposes motion utility class names', () => {
    assert.equal(pmMotion.fast, 'pm-motion-fast')
    assert.equal(pmMotion.base, 'pm-motion-base')
    assert.equal(pmMotion.slow, 'pm-motion-slow')
  })

  it('exposes layout rhythm class names', () => {
    assert.equal(pmLayout.pagePadding, 'pm-page-padding')
    assert.equal(pmLayout.tableDense, 'pm-table-dense')
  })

  it('resolves known match type styles', () => {
    assert.match(resolveMatchTypeStyle('one_way'), /info/)
    assert.match(resolveMatchTypeStyle('circular'), /success/)
  })

  it('falls back to neutral for unknown match types', () => {
    assert.match(resolveMatchTypeStyle('unknown_type'), /neutral/)
  })

  it('formats match type labels for display', () => {
    assert.equal(formatMatchTypeLabel('two_way'), 'two way')
    assert.equal(formatMatchTypeLabel('consortium'), 'consortium')
  })
})

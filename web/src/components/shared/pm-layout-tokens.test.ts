import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  pmBreakpointMedia,
  pmBreakpoints,
  pmContentWidth,
  pmLayoutGrid,
  resolveMetricColumns,
} from '@/components/shared/pm-layout-tokens.ts'

describe('pm-layout-tokens', () => {
  it('defines ascending breakpoint widths', () => {
    assert.ok(pmBreakpoints.sm < pmBreakpoints.md)
    assert.ok(pmBreakpoints.md < pmBreakpoints.lg)
    assert.ok(pmBreakpoints.lg < pmBreakpoints.xl)
    assert.ok(pmBreakpoints.xl < pmBreakpoints['2xl'])
  })

  it('exposes media query strings for each breakpoint', () => {
    assert.match(pmBreakpointMedia.lg, /1024/)
    assert.match(pmBreakpointMedia.md, /768/)
  })

  it('exposes detail grid class maps', () => {
    assert.match(pmLayoutGrid.detail, /lg:grid-cols-3/)
    assert.match(pmLayoutGrid.detailMain, /lg:col-span-2/)
  })

  it('exposes content width constraints', () => {
    assert.match(pmContentWidth.default, /max-w-7xl/)
    assert.match(pmContentWidth.narrow, /max-w-3xl/)
  })

  it('resolves metric grid variant from column count', () => {
    assert.equal(resolveMetricColumns(3), 'metricsThree')
    assert.equal(resolveMetricColumns(4), 'metrics')
    assert.equal(resolveMetricColumns(6), 'metrics')
  })

  it('exposes split and wizard grid patterns', () => {
    assert.match(pmLayoutGrid.split, /lg:grid-cols/)
    assert.match(pmLayoutGrid.wizard, /lg:grid-cols/)
  })
})

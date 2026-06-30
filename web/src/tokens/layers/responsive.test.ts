import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  pmResponsive,
  pmResponsiveViewports,
} from '@/tokens/layers/responsive'

describe('responsive tokens', () => {
  it('defines shell and page chrome containment classes', () => {
    assert.equal(pmResponsive.shellInset, 'pm-shell-inset')
    assert.equal(pmResponsive.pageChrome, 'pm-page-chrome')
  })

  it('toolbar bleed uses page padding CSS variable', () => {
    assert.match(pmResponsive.toolbarBleed, /--pm-space-page-x/)
  })

  it('documents QA viewport matrix', () => {
    assert.deepEqual(pmResponsiveViewports.mobile, [360, 390, 430])
    assert.deepEqual(pmResponsiveViewports.desktop, [1440, 1920])
  })
})

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ENTERPRISE_DARK,
  ENTERPRISE_LIGHT,
  PM_ACTIVE_THEME_IDS,
  PM_DEFAULT_THEME_ID,
  PM_PLANNED_THEME_IDS,
  PM_THEME_REGISTRY,
} from '@/theme/pm-theme-registry'
import {
  isThemeSupported,
  listActiveThemeIds,
  normalizeThemeId,
  resolveThemeById,
  resolveThemeCapabilities,
  resolveThemeClassName,
  resolveThemeIdFromLegacyMode,
} from '@/theme/pm-theme-utils'

describe('pm-theme-registry', () => {
  it('registers all five theme slots', () => {
    assert.equal(Object.keys(PM_THEME_REGISTRY).length, 5)
    assert.ok(PM_THEME_REGISTRY['enterprise-light'])
    assert.ok(PM_THEME_REGISTRY['enterprise-dark'])
    assert.ok(PM_THEME_REGISTRY['high-contrast'])
    assert.ok(PM_THEME_REGISTRY.compact)
    assert.ok(PM_THEME_REGISTRY['future-refresh-placeholder'])
  })

  it('marks only enterprise themes as active', () => {
    assert.deepEqual(PM_ACTIVE_THEME_IDS, ['enterprise-light', 'enterprise-dark'])
    assert.equal(PM_PLANNED_THEME_IDS.length, 3)
    for (const id of PM_PLANNED_THEME_IDS) {
      assert.equal(PM_THEME_REGISTRY[id].status, 'planned')
    }
  })

  it('maps enterprise-light and enterprise-dark to current css root classes', () => {
    assert.equal(ENTERPRISE_LIGHT.cssRootClass, 'light')
    assert.equal(ENTERPRISE_DARK.cssRootClass, 'dark')
    assert.equal(ENTERPRISE_LIGHT.legacyResolvedMode, 'light')
    assert.equal(ENTERPRISE_DARK.legacyResolvedMode, 'dark')
  })
})

describe('pm-theme-utils', () => {
  it('normalizes legacy aliases to canonical theme ids', () => {
    assert.equal(normalizeThemeId('light'), 'enterprise-light')
    assert.equal(normalizeThemeId('dark'), 'enterprise-dark')
    assert.equal(normalizeThemeId('enterprise-dark'), 'enterprise-dark')
    assert.equal(normalizeThemeId('unknown'), PM_DEFAULT_THEME_ID)
    assert.equal(normalizeThemeId(null), PM_DEFAULT_THEME_ID)
  })

  it('resolves theme definitions by id', () => {
    const theme = resolveThemeById('enterprise-dark')
    assert.equal(theme.id, 'enterprise-dark')
    assert.equal(theme.mode, 'dark')
  })

  it('supports only active enterprise themes', () => {
    assert.equal(isThemeSupported('enterprise-light'), true)
    assert.equal(isThemeSupported('enterprise-dark'), true)
    assert.equal(isThemeSupported('high-contrast'), false)
    assert.equal(isThemeSupported('compact'), false)
    assert.equal(isThemeSupported('future-refresh-placeholder'), false)
  })

  it('resolves class names only for active themes', () => {
    assert.equal(resolveThemeClassName('enterprise-light'), 'light')
    assert.equal(resolveThemeClassName('enterprise-dark'), 'dark')
    assert.equal(resolveThemeClassName('high-contrast'), '')
    assert.equal(resolveThemeClassName('compact'), '')
  })

  it('exposes capabilities for planned themes without token implementation', () => {
    const caps = resolveThemeCapabilities('high-contrast')
    assert.equal(caps.selectable, false)
    assert.equal(caps.tokensImplemented, false)
    assert.equal(caps.adjustsContrast, true)
  })

  it('maps legacy resolved mode to theme id', () => {
    assert.equal(resolveThemeIdFromLegacyMode('light'), 'enterprise-light')
    assert.equal(resolveThemeIdFromLegacyMode('dark'), 'enterprise-dark')
  })

  it('lists active themes matching registry', () => {
    assert.deepEqual(listActiveThemeIds(), ['enterprise-light', 'enterprise-dark'])
  })

  it('defaults to enterprise-light', () => {
    assert.equal(PM_DEFAULT_THEME_ID, 'enterprise-light')
  })
})

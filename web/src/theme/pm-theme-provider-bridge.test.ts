import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  resolveDocumentThemeClasses,
  resolveSystemThemeMode,
  resolveThemeProviderBridge,
  themeModeToPreference,
} from '@/theme/pm-theme-provider-bridge'
import { isThemeSupported, resolveThemeIdFromLegacyMode } from '@/theme/pm-theme-utils'

describe('pm-theme-provider-bridge', () => {
  it('maps legacy light to enterprise-light', () => {
    const bridge = resolveThemeProviderBridge('light', 'light')
    assert.equal(bridge.pmThemeId, 'enterprise-light')
    assert.equal(bridge.pmTheme.id, 'enterprise-light')
    assert.equal(bridge.resolvedTheme, 'light')
    assert.equal(resolveThemeIdFromLegacyMode('light'), 'enterprise-light')
  })

  it('maps legacy dark to enterprise-dark', () => {
    const bridge = resolveThemeProviderBridge('dark', 'light')
    assert.equal(bridge.pmThemeId, 'enterprise-dark')
    assert.equal(bridge.resolvedTheme, 'dark')
  })

  it('resolves system preference to active PM theme from system mode', () => {
    const lightSystem = resolveThemeProviderBridge('system', 'light')
    assert.equal(lightSystem.pmThemeId, 'enterprise-light')
    assert.equal(lightSystem.themeMode, 'light')

    const darkSystem = resolveThemeProviderBridge('system', 'dark')
    assert.equal(darkSystem.pmThemeId, 'enterprise-dark')
    assert.equal(darkSystem.themeMode, 'dark')
  })

  it('applies document classes compatible with legacy provider', () => {
    assert.deepEqual(resolveDocumentThemeClasses('light').rootClasses, ['light'])
    assert.deepEqual(resolveDocumentThemeClasses('dark').rootClasses, ['dark'])
    assert.equal(resolveDocumentThemeClasses('light').dataThemeAttribute, 'enterprise-light')
    assert.equal(resolveDocumentThemeClasses('dark').dataThemeAttribute, 'enterprise-dark')
  })

  it('maps theme mode to legacy preference', () => {
    assert.equal(themeModeToPreference('light'), 'light')
    assert.equal(themeModeToPreference('dark'), 'dark')
  })

  it('resolves system theme mode from prefers-color-scheme hint', () => {
    assert.equal(resolveSystemThemeMode(false), 'light')
    assert.equal(resolveSystemThemeMode(true), 'dark')
  })

  it('does not treat planned themes as supported', () => {
    assert.equal(isThemeSupported('high-contrast'), false)
    assert.equal(isThemeSupported('compact'), false)
    assert.equal(isThemeSupported('enterprise-light'), true)
  })
})

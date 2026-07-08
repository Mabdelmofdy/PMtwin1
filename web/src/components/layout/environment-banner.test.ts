import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEMO_ENVIRONMENT_BANNER_MESSAGE,
  resolveEnvironmentBannerContent,
  shouldShowEnvironmentBanner,
  UAT_ENVIRONMENT_BANNER_MESSAGE,
} from '@/components/layout/environment-banner.tsx'

describe('EnvironmentBanner helpers', () => {
  it('shows banner in demo mode', () => {
    assert.equal(shouldShowEnvironmentBanner('demo'), true)
    const content = resolveEnvironmentBannerContent('demo', 'LocalStorage')
    assert.ok(content)
    assert.equal(content.runtimeMode, 'demo')
  })

  it('shows banner in uat mode', () => {
    assert.equal(shouldShowEnvironmentBanner('uat'), true)
    const content = resolveEnvironmentBannerContent('uat', 'LocalStorage')
    assert.ok(content)
    assert.equal(content.runtimeMode, 'uat')
  })

  it('hides banner in production mode', () => {
    assert.equal(shouldShowEnvironmentBanner('production'), false)
    assert.equal(resolveEnvironmentBannerContent('production', 'Future API'), null)
  })

  it('displays storage type in banner content', () => {
    const content = resolveEnvironmentBannerContent('uat', 'LocalStorage')
    assert.ok(content)
    assert.equal(content.storageType, 'LocalStorage')
  })

  it('uses demo copy for demo mode', () => {
    const content = resolveEnvironmentBannerContent('demo', 'LocalStorage')
    assert.ok(content)
    assert.equal(content.message, DEMO_ENVIRONMENT_BANNER_MESSAGE)
    assert.match(content.message, /Demo Mode/)
  })

  it('uses uat copy for uat mode', () => {
    const content = resolveEnvironmentBannerContent('uat', 'LocalStorage')
    assert.ok(content)
    assert.equal(content.message, UAT_ENVIRONMENT_BANNER_MESSAGE)
    assert.match(content.message, /UAT Mode/)
  })
})

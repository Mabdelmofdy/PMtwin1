import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEMO_ENVIRONMENT_BANNER_MESSAGE,
  ENVIRONMENT_BANNER_LAYOUT_HEIGHT_PX,
  resolveEnvironmentBannerContent,
  shouldShowEnvironmentBanner,
  UAT_ENVIRONMENT_BANNER_MESSAGE,
} from '@/components/layout/environment-banner.tsx'
import { runtimeFeatureFlags } from '@/config/runtime-feature-flags.ts'
import { pmWizardSticky } from '@/tokens/layers/layout.ts'
import { buildEnvironmentMetadataSnapshot } from '@/components/admin/environment-management-panel.tsx'

describe('EnvironmentBanner — customer workspace visibility', () => {
  it('does not render the global environment banner in demo workspace', () => {
    assert.equal(shouldShowEnvironmentBanner('demo'), false)
    assert.equal(resolveEnvironmentBannerContent('demo', 'LocalStorage'), null)
  })

  it('does not render the global environment banner in UAT workspace', () => {
    assert.equal(shouldShowEnvironmentBanner('uat'), false)
    assert.equal(resolveEnvironmentBannerContent('uat', 'LocalStorage'), null)
  })

  it('does not render the global environment banner in production', () => {
    assert.equal(shouldShowEnvironmentBanner('production'), false)
    assert.equal(resolveEnvironmentBannerContent('production', 'Future API'), null)
  })

  it('keeps Admin Environment metadata available independently of the banner', () => {
    const snapshot = buildEnvironmentMetadataSnapshot()
    assert.ok(snapshot.runtimeMode.length > 0)
    assert.ok(snapshot.storageType.length > 0)
    assert.ok(snapshot.namespace.length > 0)
    assert.equal(runtimeFeatureFlags.showEnvironmentBanner, false)
  })

  it('reserves no environment-banner layout height in customer workspace', () => {
    assert.equal(ENVIRONMENT_BANNER_LAYOUT_HEIGHT_PX, 0)
    assert.match(
      pmWizardSticky.stepper,
      /top-\[calc\(var\(--environment-banner-height,0px\)\+var\(--app-header-height\)\)\]/,
    )
  })

  it('keeps wizard sticky offsets correct after banner removal', () => {
    assert.match(pmWizardSticky.stepper, /--environment-banner-height,0px/)
    assert.match(pmWizardSticky.stepper, /--app-header-height/)
    assert.match(pmWizardSticky.footer, /sticky bottom-0/)
    // Historical copy must not leak into customer chrome via the global banner helpers.
    assert.equal(shouldShowEnvironmentBanner('demo'), false)
    assert.ok(DEMO_ENVIRONMENT_BANNER_MESSAGE.includes('Demo Mode'))
    assert.ok(UAT_ENVIRONMENT_BANNER_MESSAGE.includes('UAT Mode'))
  })
})

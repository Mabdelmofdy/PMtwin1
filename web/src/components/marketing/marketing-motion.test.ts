import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  marketingCardHoverProps,
  marketingFadeUpVariants,
  marketingHeroVisualFloatProps,
  marketingStaggerContainerVariants,
} from '@/components/marketing/marketing-motion'

describe('marketing motion presets', () => {
  it('disables movement when reduced motion is on', () => {
    const fadeUp = marketingFadeUpVariants(true)
    assert.deepEqual(fadeUp.hidden, { opacity: 1, y: 0 })
    assert.deepEqual(fadeUp.visible, { opacity: 1, y: 0 })
  })

  it('enables fade-up when motion is allowed', () => {
    const fadeUp = marketingFadeUpVariants(false)
    assert.equal(fadeUp.hidden?.opacity, 0)
    assert.equal(fadeUp.visible?.opacity, 1)
    assert.equal(fadeUp.visible?.y, 0)
  })

  it('stagger container has zero stagger when reduced', () => {
    const stagger = marketingStaggerContainerVariants(true)
    assert.deepEqual(stagger.visible?.transition, { staggerChildren: 0 })
  })

  it('card hover omits transforms when reduced', () => {
    assert.equal(marketingCardHoverProps(true).whileHover, undefined)
  })

  it('hero float is static when reduced', () => {
    assert.deepEqual(marketingHeroVisualFloatProps(true).animate, { y: 0 })
  })
})

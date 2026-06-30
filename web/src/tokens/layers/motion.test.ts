import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  pmEnter,
  pmInteraction,
  pmLoading,
  pmMotion,
  pmMotionDelay,
  pmMotionDistance,
  pmMotionDuration,
  pmMotionEasing,
  pmOverlay,
  pmPipeline,
  pmReducedMotionPolicy,
  pmToast,
} from '@/tokens/layers/motion'

describe('motion tokens (DDS-005)', () => {
  it('exposes base motion utility classes', () => {
    assert.equal(pmMotion.fast, 'pm-motion-fast')
    assert.equal(pmMotion.spring, 'pm-motion-spring')
  })

  it('documents duration and delay scales in ms', () => {
    assert.equal(pmMotionDuration.fast, 120)
    assert.equal(pmMotionDuration.base, 180)
    assert.equal(pmMotionDelay.stagger, 60)
    assert.equal(pmMotionDistance.md, 8)
  })

  it('exposes interaction presets', () => {
    assert.equal(pmInteraction.press, 'pm-interactive-press')
    assert.equal(pmInteraction.tableRow, 'pm-table-row-hover')
    assert.match(pmInteraction.focus, /focus/)
  })

  it('exposes enter and loading presets', () => {
    assert.equal(pmEnter.hero, 'pm-enter-hero')
    assert.equal(pmLoading.skeleton, 'pm-skeleton')
  })

  it('exposes pipeline and overlay presets', () => {
    assert.equal(pmPipeline.dropActive, 'pm-pipeline-drop-active')
    assert.equal(pmOverlay.modal, 'pm-overlay-modal')
  })

  it('documents toast motion classes', () => {
    assert.equal(pmToast.enter, 'pm-toast-enter')
  })

  it('uses global reduced-motion collapse policy', () => {
    assert.equal(pmReducedMotionPolicy, 'global-collapse')
  })

  it('provides framer-motion easing tuple', () => {
    assert.equal(pmMotionEasing.outTuple.length, 4)
  })
})

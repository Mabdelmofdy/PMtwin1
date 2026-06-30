import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  PM_TOKEN_DEPENDENCY_ORDER,
  PM_TOKEN_LAYERS,
  pmComponentTokens,
  pmPageTokenPolicy,
  pmTokenOwnership,
  pmTokenValidationRules,
  resolveMatchTypeStyle,
} from '@/tokens'

describe('pm-token-registry', () => {
  it('defines ten official token layers', () => {
    assert.equal(PM_TOKEN_LAYERS.length, 10)
    assert.ok(PM_TOKEN_LAYERS.includes('brand'))
    assert.ok(PM_TOKEN_LAYERS.includes('chart'))
  })

  it('orders brand before semantic before component', () => {
    const brandIdx = PM_TOKEN_DEPENDENCY_ORDER.indexOf('brand')
    const semanticIdx = PM_TOKEN_DEPENDENCY_ORDER.indexOf('semantic')
    const componentIdx = PM_TOKEN_DEPENDENCY_ORDER.indexOf('component')
    assert.ok(brandIdx < semanticIdx)
    assert.ok(semanticIdx < componentIdx)
  })

  it('assigns ownership for every layer', () => {
    for (const layer of PM_TOKEN_LAYERS) {
      assert.equal(pmTokenOwnership[layer].layer, layer)
      assert.ok(pmTokenOwnership[layer].owner.length > 0)
    }
  })

  it('forbids brand as a component dependency', () => {
    assert.ok(pmTokenOwnership.component.forbiddenDependencies.includes('brand'))
  })

  it('forbids pages from importing brand tokens', () => {
    assert.ok(pmPageTokenPolicy.forbiddenImports.includes('@/tokens/layers/brand'))
  })

  it('maps component tokens to motion and radius helpers', () => {
    assert.match(pmComponentTokens.button.motion, /pm-motion/)
    assert.match(pmComponentTokens.card.radius, /rounded/)
  })

  it('lists validation forbidden patterns', () => {
    assert.ok(pmTokenValidationRules.forbidden.length >= 5)
    assert.ok(
      pmTokenValidationRules.forbidden.some((r) => r.includes('hardcoded')),
    )
  })

  it('resolves match type styles via semantic mapping', () => {
    assert.match(resolveMatchTypeStyle('one_way'), /info/)
  })
})

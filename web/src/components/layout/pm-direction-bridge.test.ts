import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  normalizeDocumentDirection,
  resolveDocumentDirectionAttributes,
  resolveDocumentLanguage,
  resolveInlineStartRevealOffset,
  resolveToastPosition,
} from '@/components/layout/pm-direction-bridge'

describe('pm-direction-bridge', () => {
  it('normalizes direction values', () => {
    assert.equal(normalizeDocumentDirection('rtl'), 'rtl')
    assert.equal(normalizeDocumentDirection('ltr'), 'ltr')
    assert.equal(normalizeDocumentDirection(null), 'ltr')
  })

  it('maps direction to document language', () => {
    assert.equal(resolveDocumentLanguage('rtl'), 'ar')
    assert.equal(resolveDocumentLanguage('ltr'), 'en')
  })

  it('resolves document attributes', () => {
    assert.deepEqual(resolveDocumentDirectionAttributes('rtl'), {
      dir: 'rtl',
      lang: 'ar',
    })
  })

  it('resolves toast position for RTL', () => {
    assert.equal(resolveToastPosition('ltr'), 'bottom-right')
    assert.equal(resolveToastPosition('rtl'), 'bottom-left')
  })

  it('flips hero reveal offset for RTL', () => {
    assert.equal(resolveInlineStartRevealOffset('ltr', 4), -4)
    assert.equal(resolveInlineStartRevealOffset('rtl', 4), 4)
  })
})

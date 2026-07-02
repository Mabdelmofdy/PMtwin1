import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { PRODUCT_LANGUAGE } from '@/lib/product-language'

describe('PRODUCT_LANGUAGE vocabulary', () => {
  it('uses Open for entity navigation actions', () => {
    assert.equal(PRODUCT_LANGUAGE.OPEN, 'Open')
    assert.equal(PRODUCT_LANGUAGE.OPEN_MATCH, 'Open match')
    assert.equal(PRODUCT_LANGUAGE.OPEN_NEGOTIATION, 'Open negotiation')
    assert.equal(PRODUCT_LANGUAGE.OPEN_DEAL, 'Open deal')
    assert.equal(PRODUCT_LANGUAGE.OPEN_CONTRACT, 'Open contract')
    assert.equal(PRODUCT_LANGUAGE.OPEN_PROFILE, 'Open profile')
  })

  it('keeps View all for collection affordances', () => {
    assert.match(PRODUCT_LANGUAGE.VIEW_ALL, /^View all/)
  })
})

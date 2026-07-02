import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normalizePublicBrandCopy, PUBLIC_BRAND_NAME } from '@/lib/public-brand'
import { filterKbFaqItems, parseKbFaqItems } from '@/lib/kb-faq-content'

describe('public brand copy', () => {
  it('exposes PM-Twin as public brand name', () => {
    assert.equal(PUBLIC_BRAND_NAME, 'PM-Twin')
  })

  it('normalizes PMTwin to PM-Twin', () => {
    assert.equal(normalizePublicBrandCopy('Welcome to PMTwin'), 'Welcome to PM-Twin')
  })
})

describe('kb faq content', () => {
  const sampleHtml = `
    <div class="kb-qa-item">
      <h3 class="kb-question">Who can use PMTwin?</h3>
      <div class="kb-answer"><p>Companies in KSA.</p></div>
    </div>
    <div class="kb-qa-item">
      <h3 class="kb-question">How to post?</h3>
      <div class="kb-answer"><p>Register first.</p></div>
    </div>
  `

  it('parses FAQ items from seed HTML', () => {
    const items = parseKbFaqItems(sampleHtml)
    assert.equal(items.length, 2)
    assert.equal(items[0]?.question, 'Who can use PM-Twin?')
    assert.match(items[0]?.answerHtml ?? '', /Companies in KSA/)
  })

  it('filters FAQ items client-side', () => {
    const items = parseKbFaqItems(sampleHtml)
    const filtered = filterKbFaqItems(items, 'post')
    assert.equal(filtered.length, 1)
    assert.equal(filtered[0]?.question, 'How to post?')
  })
})

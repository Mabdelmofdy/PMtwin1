import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildContactMailto,
  isMailtoHref,
  normalizeContactEmail,
  resolveContactHref,
  resolvePublicContactChannel,
} from '@/lib/public-contact'

describe('public contact channel resolution', () => {
  it('normalizes configured email', () => {
    const channel = resolvePublicContactChannel({
      salesEmail: ' Sales@PMTwin.com ',
    })
    assert.equal(channel.hasLiveEmailChannel, true)
    assert.equal(channel.salesEmail, 'sales@pmtwin.com')
  })

  it('falls back when contact email is not configured', () => {
    const channel = resolvePublicContactChannel({ salesEmail: null })
    assert.equal(channel.hasLiveEmailChannel, false)
    assert.equal(resolveContactHref(channel, 'sales'), '/contact')
    assert.equal(resolveContactHref(channel, 'pricing'), '/contact')
  })

  it('rejects invalid configured email', () => {
    assert.equal(normalizeContactEmail('not-an-email'), null)
  })
})

describe('public contact mailto generation', () => {
  it('creates sales inquiry mailto', () => {
    const href = buildContactMailto('sales@pmtwin.com', 'sales')
    assert.match(href, /^mailto:sales@pmtwin\.com\?subject=/)
    assert.match(href, /PM-Twin%20sales%20inquiry/)
    assert.equal(isMailtoHref(href), true)
  })

  it('creates demo request and pricing inquiry subjects', () => {
    const demoHref = buildContactMailto('sales@pmtwin.com', 'demo')
    const pricingHref = buildContactMailto('sales@pmtwin.com', 'pricing')
    assert.match(demoHref, /PM-Twin%20demo%20request/)
    assert.match(pricingHref, /PM-Twin%20pricing%20inquiry/)
  })

  it('uses configured channel for pricing CTA path', () => {
    const channel = resolvePublicContactChannel({ salesEmail: 'sales@pmtwin.com' })
    const href = resolveContactHref(channel, 'pricing')
    assert.equal(isMailtoHref(href), true)
  })
})

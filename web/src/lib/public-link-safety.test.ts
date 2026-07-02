import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isAnonymousBlockedHref } from '@/lib/public-link-safety'

describe('public link safety', () => {
  it('blocks admin and workspace deep links for anonymous visitors', () => {
    assert.equal(isAnonymousBlockedHref('/admin/matching'), true)
    assert.equal(isAnonymousBlockedHref('/contracts/1'), true)
    assert.equal(isAnonymousBlockedHref('/opportunities/create'), true)
    assert.equal(isAnonymousBlockedHref('/find'), false)
    assert.equal(isAnonymousBlockedHref('/register'), false)
  })
})

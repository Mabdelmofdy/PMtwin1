import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isMarketplaceProfileVisible } from '@/api/people.ts'
import { buildPublicProfileProjection } from '@/domain/profile/profile-public-read-model.ts'
import type { PlatformUser } from '@/types/domain.ts'

function account(patch: Partial<PlatformUser> = {}): PlatformUser {
  return {
    id: 'user-1',
    email: 'private@example.com',
    role: 'user',
    status: 'active',
    isPublic: true,
    profile: {
      name: 'Professional',
      phone: '+966500000000',
      website: 'https://example.com',
      visibility: {
        showPhone: false,
        showWebsite: true,
        showLinkedIn: false,
      },
    },
    ...patch,
  }
}

describe('marketplace profile visibility', () => {
  it('blocks private and pending profiles from list and direct-detail reads', () => {
    assert.equal(isMarketplaceProfileVisible(account({ isPublic: false })), false)
    assert.equal(
      isMarketplaceProfileVisible(account({ status: 'pending_vetting' })),
      false,
    )
  })

  it('projects only explicitly opted-in contact fields and no account email', () => {
    const projection = buildPublicProfileProjection(account(), new Set())
    const serialized = JSON.stringify(projection)

    assert.equal(projection.contact.phone, undefined)
    assert.equal(projection.contact.website, 'https://example.com')
    assert.equal(serialized.includes('private@example.com'), false)
  })

  it('does not claim verification without approved vetting status', () => {
    assert.equal(
      buildPublicProfileProjection(account(), new Set()).verified,
      false,
    )
  })
})

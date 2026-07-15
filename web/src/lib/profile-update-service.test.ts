import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { PlatformUser } from '@/types/domain.ts'
import {
  updateUserProfile,
  type ProfileUpdateRepositories,
} from '@/lib/profile-update-service.ts'

function createRepositories(
  user?: PlatformUser,
  company?: PlatformUser,
): {
  repositories: ProfileUpdateRepositories
  updatedUserIds: string[]
  updatedCompanyIds: string[]
} {
  const updatedUserIds: string[] = []
  const updatedCompanyIds: string[] = []
  return {
    repositories: {
      users: {
        getById: (id) => (user?.id === id ? user : undefined),
        update: (id, patch) => {
          updatedUserIds.push(id)
          return user ? { ...user, ...patch } : undefined
        },
      },
      companies: {
        getById: (id) => (company?.id === id ? company : undefined),
        update: (id, patch) => {
          updatedCompanyIds.push(id)
          return company ? { ...company, ...patch } : undefined
        },
      },
    },
    updatedUserIds,
    updatedCompanyIds,
  }
}

describe('updateUserProfile', () => {
  it('updates an individual in the user repository', () => {
    const user: PlatformUser = {
      id: 'user-1',
      email: 'user@example.com',
      role: 'user',
      status: 'active',
      profile: { name: 'Old name' },
    }
    const stack = createRepositories(user)

    const updated = updateUserProfile(
      user.id,
      {
        name: 'New name',
        phone: '+966500000000',
        languages: ['Arabic', 'English'],
        portfolio: ['PMO transformation — 18% schedule improvement'],
      },
      stack.repositories,
    )

    assert.equal(updated?.profile?.name, 'New name')
    assert.equal(updated?.profile?.phone, '+966500000000')
    assert.deepEqual(updated?.profile?.languages, ['Arabic', 'English'])
    assert.equal(updated?.profile?.portfolio?.length, 1)
    assert.equal(updated?.profile?.profileCompletionUnlocked, true)
    assert.deepEqual(stack.updatedUserIds, [user.id])
    assert.deepEqual(stack.updatedCompanyIds, [])
  })

  it('falls back to the company repository for company accounts', () => {
    const company: PlatformUser = {
      id: 'company-1',
      email: 'company@example.com',
      role: 'company',
      status: 'active',
      profile: { name: 'Old company' },
    }
    const stack = createRepositories(undefined, company)

    const updated = updateUserProfile(
      company.id,
      { name: 'New company', description: 'Updated description' },
      stack.repositories,
    )

    assert.equal(updated?.profile?.name, 'New company')
    assert.equal(updated?.profile?.description, 'Updated description')
    assert.deepEqual(stack.updatedUserIds, [])
    assert.deepEqual(stack.updatedCompanyIds, [company.id])
  })

  it('returns undefined when neither repository contains the account', () => {
    const stack = createRepositories()

    assert.equal(
      updateUserProfile('missing', { name: 'Missing' }, stack.repositories),
      undefined,
    )
    assert.deepEqual(stack.updatedUserIds, [])
    assert.deepEqual(stack.updatedCompanyIds, [])
  })
})

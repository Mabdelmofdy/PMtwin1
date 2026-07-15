import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { UpdateProfileCommand } from '@pm-twin/commands'
import type { PlatformUser } from '@/types/domain.ts'
import { ProfileRepository } from '@/repositories/profile-repository.ts'
import { ProfileCommandHandler } from '@/commands/handlers/profile-command-handler.ts'
import type { ProfileSubject } from '@/domain/profile/profile-subject-resolver.ts'

function createStack(profileKind: 'individual' | 'company' = 'individual') {
  let account: PlatformUser = {
    id: profileKind === 'company' ? 'company-1' : 'user-1',
    email: 'profile@example.com',
    role: profileKind === 'company' ? 'company' : 'user',
    status: 'active',
    profile: { name: 'Before' },
  }
  const repository = {
    getById: (id: string) => (id === account.id ? account : undefined),
    update: (id: string, patch: Partial<PlatformUser>) => {
      if (id !== account.id) return undefined
      account = {
        ...account,
        ...patch,
        profile: patch.profile
          ? { ...account.profile, ...patch.profile }
          : account.profile,
      }
      return account
    },
  }
  const subject: ProfileSubject = {
    partyId: `party-${account.id}`,
    workspaceId: `workspace-${account.id}`,
    sourceEntityId: account.id,
    profileId: account.id,
    profileKind,
    account,
  }
  const handler = new ProfileCommandHandler({
    profileRepository: new ProfileRepository({
      users: repository,
      companies: repository,
    }),
    resolveSubject: () => subject,
    resolveActor: () => ({
      userId: profileKind === 'company' ? 'owner-1' : account.id,
      userRole: 'user',
      activePartyId: subject.partyId,
      activeWorkspaceId: subject.workspaceId,
      workspaceRole: 'owner',
      platformRoles: [],
    }),
  })
  return { handler, readAccount: () => account }
}

function updateCommand(aggregateId: string): UpdateProfileCommand {
  return {
    commandType: 'UpdateProfile',
    aggregateId,
    clientRequestId: 'request-1',
    payload: {
      partyId: `party-${aggregateId}`,
      profilePatch: {
        name: 'After',
        skills: ['Planning', 'Risk'],
      },
    },
  }
}

describe('ProfileCommandHandler', () => {
  it('updates an individual profile through the profile repository', () => {
    const stack = createStack('individual')
    const result = stack.handler.handle(updateCommand('user-1'))

    assert.equal(result.success, true)
    assert.equal(stack.readAccount().profile?.name, 'After')
    assert.deepEqual(stack.readAccount().profile?.skills, ['Planning', 'Risk'])
  })

  it('updates the active company Party profile, not the actor user', () => {
    const stack = createStack('company')
    const result = stack.handler.handle(updateCommand('company-1'))

    assert.equal(result.success, true)
    assert.equal(stack.readAccount().profile?.name, 'After')
  })

  it('rejects an actor outside the profile Party', () => {
    const stack = createStack('company')
    const denied = new ProfileCommandHandler({
      profileRepository: new ProfileRepository({
        users: {
          getById: () => undefined,
          update: () => undefined,
        },
        companies: {
          getById: () => stack.readAccount(),
          update: () => stack.readAccount(),
        },
      }),
      resolveSubject: () => ({
        partyId: 'party-company-1',
        sourceEntityId: 'company-1',
        profileId: 'company-1',
        profileKind: 'company',
        account: stack.readAccount(),
      }),
      resolveActor: () => ({
        userId: 'outsider',
        userRole: 'user',
        activePartyId: 'party-other',
        platformRoles: [],
      }),
    })

    const result = denied.handle(updateCommand('company-1'))
    assert.equal(result.success, false)
    assert.match(result.errors?.[0] ?? '', /permission/i)
  })
})

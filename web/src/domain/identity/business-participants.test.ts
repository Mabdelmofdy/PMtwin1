import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  actorMayActForParty,
  countAcceptedParties,
  toBusinessParticipants,
} from './business-participants.ts'

describe('business-participants', () => {
  const ctx = {
    companyIds: new Set(['co-1']),
    userIds: new Set(['u-1', 'u-2', 'u-3']),
  }

  it('deduplicates company employees into one party participant', () => {
    const participants = toBusinessParticipants(
      [
        { userId: 'co-1', role: 'need_owner' },
        { userId: 'u-2', role: 'rep' },
      ],
      { companyIds: new Set(['co-1']), userIds: ctx.userIds },
    )
    // co-1 maps to company party; u-2 maps to individual — two parties
    assert.equal(participants.length, 2)

    const sameCompanyReps = toBusinessParticipants(
      [
        { userId: 'co-1', role: 'need_owner', partyId: 'party-company-co-1', workspaceId: 'ws-company-co-1' },
        {
          userId: 'u-2',
          role: 'rep',
          partyId: 'party-company-co-1',
          workspaceId: 'ws-company-co-1',
          representativeUserIds: ['u-2'],
        },
      ],
      ctx,
    )
    assert.equal(sameCompanyReps.length, 1)
    assert.ok(sameCompanyReps[0]?.representativeUserIds?.includes('u-2'))
  })

  it('counts quorum by party not by user', () => {
    const count = countAcceptedParties(
      [
        {
          userId: 'u-1',
          role: 'a',
          partyId: 'party-a',
          workspaceId: 'ws-a',
          approvalStatus: 'accepted',
        },
        {
          userId: 'u-2',
          role: 'a',
          partyId: 'party-a',
          workspaceId: 'ws-a',
          approvalStatus: 'accepted',
        },
        {
          userId: 'u-3',
          role: 'b',
          partyId: 'party-b',
          workspaceId: 'ws-b',
          approvalStatus: 'accepted',
        },
      ],
      ctx,
    )
    assert.equal(count, 2)
  })

  it('allows actor only for their party', () => {
    assert.equal(
      actorMayActForParty({
        actorUserId: 'u-1',
        actorPartyId: 'party-a',
        participant: {
          partyId: 'party-a',
          workspaceId: 'ws-a',
          role: 'need_owner',
        },
      }),
      true,
    )
    assert.equal(
      actorMayActForParty({
        actorUserId: 'outsider',
        actorPartyId: 'party-x',
        participant: {
          partyId: 'party-a',
          workspaceId: 'ws-a',
          role: 'need_owner',
        },
      }),
      false,
    )
  })
})

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  findParticipant,
  getWorkflowNextActions,
} from '../dist/index.js'

describe('findParticipant representative matching', () => {
  const participants = [
    {
      userId: 'company-proxy',
      role: 'need_owner',
      participantStatus: 'pending',
      partyId: 'party-company-1',
      representativeUserIds: ['employee-a'],
    },
    {
      userId: 'user-offer',
      role: 'offer_provider',
      participantStatus: 'pending',
    },
  ]

  it('matches representativeUserIds', () => {
    const found = findParticipant(participants, 'employee-a')
    assert.equal(found?.userId, 'company-proxy')
  })

  it('matches activePartyId', () => {
    const found = findParticipant(participants, 'other-user', {
      activePartyId: 'party-company-1',
    })
    assert.equal(found?.userId, 'company-proxy')
  })

  it('exposes accept_match for representative users', () => {
    const actions = getWorkflowNextActions({
      primaryWorkflow: 'marketplace',
      user: {
        userId: 'employee-a',
        canMutate: true,
        activePartyId: 'party-company-1',
      },
      postMatch: {
        id: 'pm-1',
        status: 'discovered',
        matchType: 'one_way',
        participants,
      },
      linkage: {},
    })
    const accept = actions.find((action) => action.key === 'accept_match')
    assert.equal(accept?.visible, true)
    assert.equal(accept?.enabled, true)
  })
})

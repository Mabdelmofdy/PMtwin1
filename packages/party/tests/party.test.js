import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  assertCreatablePartyType,
  canPartyOwnSubModel,
  canPartyParticipate,
  getRelationshipType,
  isReservedPartyType,
  partyFromAccount,
  relationshipFlagsFromSupported,
  resolveOwnerPartyId,
  resolvePrimaryRelationship,
  synthesizePrimaryMembership,
  validatePartyEligibility,
} from '../dist/index.js'

const ALL_RELATIONSHIPS = ['B2B', 'B2P', 'P2B', 'P2P']

const taskBasedApplicability = {
  allowedPartyTypes: ['company', 'individual'],
  primaryRelationship: 'B2B',
  supportedRelationships: ALL_RELATIONSHIPS,
  ...relationshipFlagsFromSupported(ALL_RELATIONSHIPS),
  ownershipPolicy: {
    mode: 'single',
    transferable: true,
    requiresPrimaryOwner: true,
  },
  participantConstraints: {
    minimumParticipants: 1,
    maximumParticipants: 1,
    recommendedParticipants: 1,
  },
}

const projectJvApplicability = {
  allowedPartyTypes: ['company'],
  primaryRelationship: 'B2B',
  supportedRelationships: ['B2B'],
  supportsB2B: true,
  supportsB2P: false,
  supportsP2B: false,
  supportsP2P: false,
  ownershipPolicy: {
    mode: 'shared',
    transferable: false,
    requiresPrimaryOwner: true,
  },
  participantConstraints: {
    minimumParticipants: 2,
    maximumParticipants: 'unlimited',
    recommendedParticipants: 2,
  },
  reason: 'Project-Specific Joint Venture requires a company entity',
}

describe('Party synthesis', () => {
  it('synthesizes company party from account', () => {
    const party = partyFromAccount(
      {
        id: 'seed-co-corp-001',
        email: 'corp@example.com',
        status: 'active',
        profile: { name: 'ABC Construction', type: 'company' },
      },
      true,
    )
    assert.equal(party.id, 'seed-co-corp-001')
    assert.equal(party.partyType, 'company')
    assert.equal(party.sourceEntityId, 'seed-co-corp-001')
    assert.equal(party.sourceEntityType, 'company')
    assert.equal(party.displayName, 'ABC Construction')
  })

  it('synthesizes individual party from account', () => {
    const party = partyFromAccount(
      {
        id: 'seed-user-001',
        email: 'consultant@example.com',
        profile: { name: 'Independent Structural Consultant' },
      },
      false,
    )
    assert.equal(party.partyType, 'individual')
    assert.equal(party.sourceEntityType, 'individual')
    assert.equal(party.primaryContactId, 'seed-user-001')
  })

  it('synthesizes primary membership', () => {
    const membership = synthesizePrimaryMembership('seed-user-001', 'seed-user-001')
    assert.equal(membership.userId, 'seed-user-001')
    assert.equal(membership.partyId, 'seed-user-001')
    assert.equal(membership.isPrimary, true)
    assert.equal(membership.membershipRole, 'owner')
  })
})

describe('Party type guards', () => {
  it('allows implemented party types', () => {
    assert.equal(assertCreatablePartyType('company'), 'company')
    assert.equal(assertCreatablePartyType('individual'), 'individual')
  })

  it('rejects reserved party types', () => {
    assert.throws(() => assertCreatablePartyType('government'))
    assert.ok(isReservedPartyType('bank'))
  })
})

describe('Ownership resolution', () => {
  it('prefers ownerPartyId over creatorId', () => {
    assert.equal(
      resolveOwnerPartyId({ ownerPartyId: 'party-1', creatorId: 'user-1' }),
      'party-1',
    )
  })

  it('falls back to creatorId then companyId', () => {
    assert.equal(resolveOwnerPartyId({ creatorId: 'user-1' }), 'user-1')
    assert.equal(resolveOwnerPartyId({ companyId: 'co-1' }), 'co-1')
  })
})

describe('Eligibility engine', () => {
  it('derives relationship types', () => {
    assert.equal(getRelationshipType('company', 'company'), 'B2B')
    assert.equal(getRelationshipType('company', 'individual'), 'B2P')
    assert.equal(getRelationshipType('individual', 'company'), 'P2B')
    assert.equal(getRelationshipType('individual', 'individual'), 'P2P')
  })

  it('blocks individual owner for company-only JV sub-model', () => {
    assert.equal(canPartyOwnSubModel('individual', projectJvApplicability), false)
    assert.equal(canPartyOwnSubModel('company', projectJvApplicability), true)
  })

  it('validates participation by supportedRelationships', () => {
    assert.equal(
      canPartyParticipate('company', 'individual', projectJvApplicability),
      false,
    )
    assert.equal(canPartyParticipate('company', 'company', projectJvApplicability), true)
  })

  it('aggregates eligibility validation', () => {
    const invalid = validatePartyEligibility(
      { ownerPartyType: 'individual', participantPartyType: 'company' },
      projectJvApplicability,
    )
    assert.equal(invalid.valid, false)
    assert.ok(invalid.errors.length > 0)

    const valid = validatePartyEligibility(
      { ownerPartyType: 'company', participantPartyType: 'company' },
      taskBasedApplicability,
    )
    assert.equal(valid.valid, true)
  })

  it('resolves primary relationship from applicability', () => {
    assert.equal(resolvePrimaryRelationship(taskBasedApplicability), 'B2B')
    assert.equal(resolvePrimaryRelationship(projectJvApplicability), 'B2B')
  })
})

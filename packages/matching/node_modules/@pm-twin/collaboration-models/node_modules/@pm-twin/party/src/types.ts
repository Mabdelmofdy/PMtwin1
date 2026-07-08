/** Implemented party types for Sprint 2.5. */
export type ImplementedPartyType = 'company' | 'individual'

/** Extensible party type union — reserved types are not implemented this sprint. */
export type PartyType =
  | ImplementedPartyType
  | 'government'
  | 'bank'
  | 'investor'
  | 'university'
  | 'consortium'
  | 'association'
  | 'ngo'

/** Source entity backing a Party record. */
export type SourceEntityType = ImplementedPartyType

export type PartyStatus = 'active' | 'pending' | 'suspended' | 'archived'

export type PartyMembershipRole = 'owner' | 'admin' | 'member' | 'viewer'
export type PartyMembershipStatus = 'active' | 'invited' | 'suspended'

export type Party = {
  readonly id: string
  readonly partyType: PartyType
  readonly displayName: string
  readonly status: PartyStatus | string
  readonly sourceEntityId: string
  readonly sourceEntityType: SourceEntityType
  readonly primaryContactId?: string
  readonly createdAt?: string
  readonly updatedAt?: string
}

export type PartyMembership = {
  readonly userId: string
  readonly partyId: string
  readonly membershipRole: PartyMembershipRole | string
  readonly permissions?: readonly string[]
  readonly status: PartyMembershipStatus | string
  readonly isPrimary: boolean
  readonly joinedAt?: string
}

export type PartyReferenceRelationshipRole =
  | 'owner'
  | 'participant'
  | 'client'
  | 'supplier'
  | 'consultant'
  | 'reviewer'
  | 'approver'
  | 'auditor'
  | 'observer'

export type PartyReferenceParticipationStatus =
  | 'active'
  | 'pending'
  | 'withdrawn'
  | 'completed'

/** Architectural preparation — future commercial entities use relatedParties: PartyReference[] */
export type PartyReference = {
  readonly partyId: string
  readonly relationshipRole: PartyReferenceRelationshipRole
  readonly participationStatus: PartyReferenceParticipationStatus
  readonly isPrimary: boolean
}

export type RelationshipType = 'B2B' | 'B2P' | 'P2B' | 'P2P'

export type OwnershipPolicyMode = 'single' | 'shared' | 'multi'

export type OwnershipPolicy = {
  readonly mode: OwnershipPolicyMode
  readonly transferable: boolean
  readonly requiresPrimaryOwner: boolean
}

export type ParticipantConstraints = {
  readonly minimumParticipants: number
  readonly maximumParticipants: number | 'unlimited'
  readonly recommendedParticipants: number
}

/** Minimal applicability shape consumed by the eligibility engine. */
export type ApplicabilityInput = {
  readonly allowedPartyTypes?: readonly ImplementedPartyType[]
  readonly primaryRelationship?: RelationshipType
  readonly supportedRelationships: readonly RelationshipType[]
  readonly supportsB2B?: boolean
  readonly supportsB2P?: boolean
  readonly supportsP2B?: boolean
  readonly supportsP2P?: boolean
  readonly ownershipPolicy: OwnershipPolicy
  readonly participantConstraints: ParticipantConstraints
  readonly reason?: string
}

export type PartyEligibilityContext = {
  readonly ownerPartyType: ImplementedPartyType
  readonly participantPartyType?: ImplementedPartyType
}

export type PartyEligibilityResult = {
  readonly valid: boolean
  readonly errors: readonly string[]
  readonly warnings: readonly string[]
}

/** Minimal account shape for party synthesis from web runtime. */
export type SourceEntityAccount = {
  readonly id: string
  readonly email?: string
  readonly status?: string
  readonly role?: string
  readonly createdAt?: string
  readonly updatedAt?: string
  readonly profile?: {
    readonly name?: string
    readonly type?: string
  }
}

export type OwnerResolvableEntity = {
  readonly ownerPartyId?: string
  readonly creatorId?: string
  readonly companyId?: string
}

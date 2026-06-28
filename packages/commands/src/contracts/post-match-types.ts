/** PostMatch participant DTO — transport shape only (zero-dependency). */

export interface PostMatchParticipant {

  readonly userId: string

  readonly role: string

  readonly opportunityId?: string

  readonly participantStatus?: string

  readonly respondedAt?: string | null

}



/** Scoring breakdown attached to DiscoverPostMatch (maps to matchCriteria / payload.breakdown). */

export type PostMatchCriteria = Readonly<Record<string, number>>



/** Known PostMatch model types for the Need/Offer flow. */

export type PostMatchType =

  | 'one_way'

  | 'two_way'

  | 'consortium'

  | 'circular'



/** Barter side — one party's need + offer pair (two_way). */

export interface PostMatchBarterSide {

  readonly userId: string

  readonly needId: string

  readonly offerId: string

}



/** Consortium role assignment. */

export interface PostMatchConsortiumRole {

  readonly role: string

  readonly opportunityId: string

  readonly userId: string

  readonly score?: number

}



/** Directed edge in a circular exchange chain. */

export interface PostMatchCircularLink {

  readonly fromCreatorId: string

  readonly toCreatorId: string

  readonly needId: string

  readonly offerId: string

  readonly score: number

}



/** Topology-specific discover payloads (ADR-MATCH-001). */

export interface DiscoverOneWayPayload {

  readonly needOpportunityId: string

  readonly offerOpportunityId: string

  readonly matchCriteria: PostMatchCriteria

}



export interface DiscoverTwoWayPayload {

  readonly sideA: PostMatchBarterSide

  readonly sideB: PostMatchBarterSide

  readonly scoreAtoB?: number

  readonly scoreBtoA?: number

  readonly valueEquivalence?: string | null

}



export interface DiscoverConsortiumPayload {

  readonly leadNeedId: string

  readonly roles: readonly PostMatchConsortiumRole[]

  readonly valueBalance?: unknown

}



export interface DiscoverCircularPayload {

  readonly cycle: readonly string[]

  readonly links: readonly PostMatchCircularLink[]

  readonly chainBalance?: unknown

}



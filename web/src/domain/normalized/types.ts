/**
 * Normalized domain models — shadow layer on top of legacy storage shapes.
 * These interfaces use canonical naming only; legacy fields are mapped via adapters.
 */

import type { OpportunityIntent } from '@/types/enums.ts'

export type NormalizedCommercialTerms = {
  amount?: number
  currency?: string
  duration?: string
  paymentSchedule?: string
  profitSplit?: number | string
  exchangeMode?: string
}

export type NormalizedParticipant = {
  userId: string
  role: string
  opportunityId?: string
  participantStatus?: string
  approvalStatus?: string
  respondedAt?: string | null
  signedAt?: string | null
}

export type NormalizedProfile = {
  name?: string
  headline?: string
  type?: string
  location?: string
  bio?: string
  description?: string
  skills?: string[]
}

/** Known user statuses — union remains open via trailing string index. */
export type NormalizedUserStatus =
  | 'pending'
  | 'active'
  | 'suspended'
  | 'rejected'
  | 'clarification_requested'
  | (string & {})

export type NormalizedUser = {
  id: string
  email: string
  role: string
  status: NormalizedUserStatus
  tenantId?: string
  organizationId?: string
  isPublic?: boolean
  profile?: NormalizedProfile
  createdAt: string
  updatedAt: string
}

export type NormalizedCompany = {
  id: string
  email: string
  role: string
  status: NormalizedUserStatus
  tenantId?: string
  organizationId?: string
  isPublic?: boolean
  profile?: NormalizedProfile
  createdAt: string
  updatedAt: string
}

export type NormalizedOpportunityStatus =
  | 'draft'
  | 'published'
  | 'matched'
  | 'negotiation'
  | 'in_negotiation'
  | 'contracted'
  | 'execution'
  | 'in_execution'
  | 'completed'
  | 'cancelled'
  | 'closed'
  | (string & {})

export type NormalizedOpportunity = {
  id: string
  title: string
  description?: string
  status: NormalizedOpportunityStatus
  creatorId?: string
  tenantId?: string
  organizationId?: string
  location?: string
  exchangeMode?: string
  modelType?: string
  /** Canonical intent — legacy `request` normalized to `need` on read. */
  intent?: OpportunityIntent
  scope?: { coreSkills?: string[]; sectors?: string[] }
  attributes?: {
    coreSkills?: string[]
    startDate?: string
    tenderDeadline?: string
  }
  createdAt: string
  updatedAt: string
}

export type NormalizedApplicationStatus =
  | 'submitted'
  | 'pending'
  | 'reviewing'
  | 'shortlisted'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'negotiation'
  | 'in_negotiation'
  | 'contracted'
  | (string & {})

export type NormalizedApplication = {
  id: string
  opportunityId: string
  applicantId: string
  status: NormalizedApplicationStatus
  tenantId?: string
  organizationId?: string
  proposal?: string
  coverLetter?: string
  commercialTerms?: NormalizedCommercialTerms
  matchId?: string
  matchType?: string
  negotiationId?: string
  dealId?: string
  createdAt: string
  updatedAt: string
}

/** Canonical Match (maps from legacy PostMatch / match storage). */
export type NormalizedMatchStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'confirmed'
  | 'expired'
  | (string & {})

export type NormalizedMatchPayload = {
  needOpportunityId?: string
  offerOpportunityId?: string
  leadNeedId?: string
  breakdown?: Record<string, number>
  valueAnalysis?: unknown
  sideA?: {
    userId: string
    needId: string
    offerId: string
  }
  sideB?: {
    userId: string
    needId: string
    offerId: string
  }
  scoreAtoB?: number
  scoreBtoA?: number
  valueEquivalence?: string | null
  roles?: Array<{
    role: string
    opportunityId: string
    userId: string
    score?: number
  }>
  valueBalance?: unknown
  cycle?: string[]
  links?: Array<{
    fromCreatorId: string
    toCreatorId: string
    needId: string
    offerId: string
    score: number
  }>
  linkScores?: Array<{
    fromCreatorId: string
    toCreatorId: string
    needId: string
    offerId: string
    score: number
  }>
  chainBalance?: unknown
}

export type NormalizedMatch = {
  id: string
  matchType: string
  status: NormalizedMatchStatus
  matchScore: number
  needOpportunityId?: string
  offerOpportunityId?: string
  matchCriteria?: Record<string, number>
  tenantId?: string
  organizationId?: string
  runId?: string
  participants: NormalizedParticipant[]
  payload?: NormalizedMatchPayload
  expiresAt?: string
  isReplacement?: boolean
  dealId?: string
  negotiationId?: string
  createdAt: string
  updatedAt: string
}

export type NormalizedNegotiationStatus =
  | 'active'
  | 'countered'
  | 'counter_offered'
  | 'agreed'
  | 'expired'
  | 'cancelled'
  | 'failed'
  | 'open'
  | (string & {})

export type NormalizedNegotiationRound = {
  by: string
  at: string
  proposal: Record<string, unknown>
  message?: string
}

export type NormalizedNegotiation = {
  id: string
  opportunityId?: string
  matchId?: string
  applicationId?: string | null
  status: NormalizedNegotiationStatus
  tenantId?: string
  organizationId?: string
  participants: NormalizedParticipant[]
  commercialTerms?: NormalizedCommercialTerms
  rounds?: NormalizedNegotiationRound[]
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export type NormalizedDealMilestone = {
  id: string
  title: string
  description?: string
  dueDate?: string
  status?: string
  deliverables?: string
  submittedAt?: string | null
  approvedAt?: string | null
  approvedBy?: string | null
}

export type NormalizedDealStatus =
  | 'draft'
  | 'active'
  | 'execution'
  | 'completed'
  | 'cancelled'
  | 'negotiating'
  | 'signing'
  | 'review'
  | 'delivery'
  | 'closed'
  | (string & {})

export type NormalizedDeal = {
  id: string
  negotiationId: string
  opportunityId: string
  opportunityIds?: string[]
  matchId?: string | null
  applicationId?: string | null
  matchType?: string
  title: string
  status: NormalizedDealStatus
  tenantId?: string
  organizationId?: string
  participants: NormalizedParticipant[]
  commercialTerms?: NormalizedCommercialTerms
  scope?: string
  deliverables?: string | string[]
  milestones?: NormalizedDealMilestone[]
  timeline?: { start?: string; end?: string }
  exchangeMode?: string
  contractId?: string | null
  completedAt?: string | null
  closedAt?: string | null
  createdAt: string
  updatedAt: string
}

export type NormalizedContractStatus =
  | 'draft'
  | 'pending_signature'
  | 'pending'
  | 'active'
  | 'completed'
  | 'terminated'
  | (string & {})

export type NormalizedContract = {
  id: string
  dealId: string
  opportunityId?: string
  opportunityIds?: string[]
  matchId?: string | null
  applicationId?: string | null
  negotiationId?: string | null
  status: NormalizedContractStatus
  tenantId?: string
  organizationId?: string
  participants: NormalizedParticipant[]
  commercialTerms?: NormalizedCommercialTerms
  scope?: string
  paymentMode?: string
  signedAt?: string | null
  version?: number
  createdAt: string
  updatedAt: string
}

export type NormalizedNotification = {
  id: string
  userId: string
  type?: string
  title: string
  message: string
  link?: string
  read: boolean
  entityType?: string
  entityId?: string
  tenantId?: string
  organizationId?: string
  createdAt: string
  updatedAt: string
}

export type NormalizedAuditLog = {
  id: string
  action: string
  userId?: string
  actorType?: string
  entityType?: string
  entityId?: string
  details?: Record<string, unknown>
  requestId?: string
  ipAddress?: string
  tenantId?: string
  organizationId?: string
  createdAt: string
  updatedAt: string
}

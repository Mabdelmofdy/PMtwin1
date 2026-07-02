// ---------------------------------------------------------------------------
// PMTwin Domain Types — canonical source of truth for all entity types.
// ---------------------------------------------------------------------------

import type {
  ApplicationStatus,
  AuditActorType,
  ContractStatus,
  DealStatus,
  EntityType,
  MatchType,
  NegotiationStatus,
  NotificationType,
  OpportunityIntentStored,
  OpportunityStatus,
  UserRole,
} from '@/types/enums.ts'
import type {
  ApplicationValue,
  CommercialTerms,
  NegotiationTerms,
} from '@/types/commercial-terms.ts'
import type { Participant } from '@/types/participant.ts'

export type { Organization, OrganizationStatus } from '@/types/organization.ts'
export type {
  ApplicationStatus,
  AuditActorType,
  ContractStatus,
  DealStatus,
  EntityType,
  MatchType,
  NegotiationStatus,
  NotificationType,
  OpportunityIntent,
  OpportunityIntentStored,
  OpportunityStatus,
  UserRole,
} from '@/types/enums.ts'
export type {
  ApplicationValue,
  CommercialTerms,
  NegotiationTerms,
} from '@/types/commercial-terms.ts'
export type { Participant, Party } from '@/types/participant.ts'

export type TenantScoped = {
  tenantId?: string
  organizationId?: string
}

export type PersonProfile = {
  name?: string
  headline?: string
  type?: string
  location?: string
  bio?: string
  description?: string
  skills?: string[]
}

export type PlatformUser = TenantScoped & {
  id: string
  email: string
  passwordHash?: string
  role: UserRole | string
  status: string
  isPublic?: boolean
  createdAt?: string
  updatedAt?: string
  profile?: PersonProfile
}

/** @deprecated Prefer Organization for SaaS; Company remains a PlatformUser alias for Sprint 1 compat. */
export type Company = PlatformUser

export type PendingUser = PlatformUser

export type Opportunity = TenantScoped & {
  id: string
  title: string
  description?: string
  status: OpportunityStatus | string
  creatorId?: string
  location?: string
  exchangeMode?: string
  modelType?: string
  /** Canonical `need` | `offer` | `hybrid`, or legacy `request` (→ need on read). */
  intent?: OpportunityIntentStored
  scope?: { coreSkills?: string[]; sectors?: string[] }
  attributes?: { coreSkills?: string[]; startDate?: string; tenderDeadline?: string }
  updatedAt?: string
  createdAt?: string
}

export type Application = TenantScoped & {
  id: string
  opportunityId: string
  applicantId: string
  status: ApplicationStatus | string
  proposal?: string
  coverLetter?: string
  /** @deprecated Prefer commercialTerms */
  application_value?: ApplicationValue
  commercialTerms?: CommercialTerms
  matchId?: string
  matchType?: MatchType | string
  negotiationId?: string
  dealId?: string
  createdAt?: string
  updatedAt?: string
}

export type PostMatchBarterSide = {
  userId: string
  needId: string
  offerId: string
}

export type PostMatchConsortiumRole = {
  role: string
  opportunityId: string
  userId: string
  score?: number
}

export type PostMatchCircularLink = {
  fromCreatorId: string
  toCreatorId: string
  needId: string
  offerId: string
  score: number
}

export type PostMatchOneWayPayload = {
  needOpportunityId: string
  offerOpportunityId: string
  breakdown?: Record<string, number>
  valueAnalysis?: unknown
}

export type PostMatchTwoWayPayload = {
  sideA: PostMatchBarterSide
  sideB: PostMatchBarterSide
  scoreAtoB?: number
  scoreBtoA?: number
  valueEquivalence?: string | null
}

export type PostMatchConsortiumPayload = {
  leadNeedId: string
  roles: PostMatchConsortiumRole[]
  valueBalance?: unknown
}

export type PostMatchCircularPayload = {
  cycle: string[]
  links: PostMatchCircularLink[]
  linkScores?: PostMatchCircularLink[]
  chainBalance?: unknown
}

export type PostMatchPayload = {
  needOpportunityId?: string
  offerOpportunityId?: string
  breakdown?: Record<string, number>
  valueAnalysis?: unknown
  sideA?: PostMatchBarterSide
  sideB?: PostMatchBarterSide
  scoreAtoB?: number
  scoreBtoA?: number
  valueEquivalence?: string | null
  leadNeedId?: string
  roles?: PostMatchConsortiumRole[]
  valueBalance?: unknown
  cycle?: string[]
  links?: PostMatchCircularLink[]
  linkScores?: PostMatchCircularLink[]
  chainBalance?: unknown
}

export type PostMatch = TenantScoped & {
  id: string
  matchType: MatchType | string
  status: string
  matchScore: number
  /** Promoted from payload for one_way matches (ADR-002 / ADR-MATCH-001). */
  needOpportunityId?: string
  /** Promoted from payload for one_way matches (ADR-002 / ADR-MATCH-001). */
  offerOpportunityId?: string
  /** Scoring breakdown; alias of payload.breakdown when promoted on read. */
  matchCriteria?: Record<string, number>
  runId?: string
  participants: Participant[]
  payload?: PostMatchPayload
  createdAt?: string
  updatedAt?: string
  expiresAt?: string
  isReplacement?: boolean
  dealId?: string
  negotiationId?: string
  /** Set when superseded by a newer PostMatch (ADR-002). */
  replacementPostMatchId?: string
}

export type AppNotification = TenantScoped & {
  id: string
  userId: string
  type?: NotificationType | string
  title: string
  message: string
  link?: string
  read: boolean
  entityType?: EntityType | string
  entityId?: string
  createdAt: string
}

export type NegotiationRound = {
  by: string
  at: string
  proposal: Record<string, unknown>
  message?: string
}

export type Negotiation = TenantScoped & {
  id: string
  opportunityId?: string
  /** Canonical PostMatch link (ADR-002). */
  postMatchId?: string
  needOpportunityId?: string
  offerOpportunityId?: string
  /** All opportunities referenced by the source match (topology-aware). */
  opportunityIds?: string[]
  /** @deprecated Prefer postMatchId — legacy seed field */
  matchId?: string
  applicationId?: string | null
  participants?: Participant[]
  /** @deprecated Use participants — legacy seed field */
  parties?: Participant[]
  status: NegotiationStatus | string
  /** @deprecated Prefer commercialTerms */
  initialTerms?: NegotiationTerms
  /** @deprecated Prefer commercialTerms */
  agreedTerms?: NegotiationTerms | null
  commercialTerms?: CommercialTerms
  rounds?: NegotiationRound[]
  expiresAt?: string
  createdAt?: string
  updatedAt?: string
}

export type DealMilestone = {
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

export type Deal = TenantScoped & {
  id: string
  negotiationId: string
  opportunityId: string
  opportunityIds?: string[]
  /** Canonical PostMatch link (ADR-002). */
  postMatchId?: string
  needOpportunityId?: string
  offerOpportunityId?: string
  /** @deprecated Prefer postMatchId — legacy seed field */
  matchId?: string | null
  applicationId?: string | null
  matchType?: MatchType | string
  title: string
  status: DealStatus | string
  participants: Participant[]
  /** @deprecated Use participants — legacy compat alias */
  parties?: Participant[]
  commercialTerms?: CommercialTerms
  /** @deprecated Prefer commercialTerms */
  terms?: NegotiationTerms
  /** @deprecated Prefer commercialTerms — POC seed field */
  valueTerms?: Record<string, unknown>
  scope?: string
  deliverables?: string | string[]
  milestones?: DealMilestone[]
  timeline?: { start?: string; end?: string }
  exchangeMode?: string
  payload?: Record<string, unknown> | null
  roleSlots?: Record<string, string> | null
  contractId?: string | null
  createdAt: string
  updatedAt: string
  completedAt?: string | null
  closedAt?: string | null
}

export type Contract = TenantScoped & {
  id: string
  dealId: string
  opportunityId?: string
  opportunityIds?: string[]
  matchId?: string | null
  applicationId?: string | null
  negotiationId?: string | null
  invitationId?: string | null
  participants: Participant[]
  /** @deprecated Use participants — legacy compat alias */
  parties?: Participant[]
  commercialTerms?: CommercialTerms
  /** @deprecated Prefer commercialTerms */
  terms?: Record<string, unknown>
  scope?: string
  paymentMode?: string
  agreedValue?: number | null
  duration?: string
  paymentSchedule?: string | null
  equityVesting?: unknown
  profitShare?: string | null
  milestonesSnapshot?: unknown
  status: ContractStatus | string
  signedAt?: string | null
  version?: number
  createdAt: string
  updatedAt: string
}

export type AuditEntry = TenantScoped & {
  id: string
  action: string
  userId?: string
  actorType?: AuditActorType | string
  entityType?: EntityType | string
  entityId?: string
  details?: Record<string, unknown>
  requestId?: string
  ipAddress?: string
  timestamp?: string
}

export type AuthSession = {
  token: string
  userId: string
  rememberMe: boolean
}

export type AccountType = 'auto' | 'individual' | 'company'

export type SiteContentSection = {
  label: string
  html: string
}

export type SiteContentPage = {
  label: string
  route: string
  sections: Record<string, SiteContentSection>
}

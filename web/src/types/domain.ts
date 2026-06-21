// ---------------------------------------------------------------------------
// PMTwin Domain Types — canonical source of truth for all entity types.
// All modules should import domain types from here.
// ---------------------------------------------------------------------------

export type PersonProfile = {
  name?: string
  headline?: string
  type?: string
  location?: string
  bio?: string
  description?: string
  skills?: string[]
}

export type PlatformUser = {
  id: string
  email: string
  passwordHash?: string
  role: string
  status: string
  isPublic?: boolean
  createdAt?: string
  profile?: PersonProfile
}

export type Company = PlatformUser

export type PendingUser = PlatformUser

export type Opportunity = {
  id: string
  title: string
  description?: string
  status: string
  creatorId?: string
  location?: string
  exchangeMode?: string
  modelType?: string
  intent?: string
  scope?: { coreSkills?: string[] }
  attributes?: { coreSkills?: string[] }
  updatedAt?: string
  createdAt?: string
}

export type ApplicationValue = {
  amount?: number
  currency?: string
  requestedValue?: number
  requested_value?: number
  value_score?: number
}

export type Application = {
  id: string
  opportunityId: string
  applicantId: string
  status: string
  proposal?: string
  coverLetter?: string
  application_value?: ApplicationValue
  matchId?: string
  matchType?: string
  negotiationId?: string
  dealId?: string
  createdAt?: string
  updatedAt?: string
}

export type PostMatch = {
  id: string
  matchType: string
  status: string
  matchScore: number
  runId?: string
  participants: Array<{
    userId: string
    opportunityId?: string
    role: string
    participantStatus: string
    respondedAt?: string | null
  }>
  payload?: {
    needOpportunityId?: string
    offerOpportunityId?: string
    breakdown?: Record<string, number>
    valueAnalysis?: unknown
  }
  createdAt?: string
  updatedAt?: string
  expiresAt?: string
  isReplacement?: boolean
}

export type AppNotification = {
  id: string
  userId: string
  type?: string
  title: string
  message: string
  link?: string
  read: boolean
  entityType?: string
  entityId?: string
  createdAt: string
}

export type NegotiationTerms = {
  value?: number
  currency?: string
  duration?: string
  paymentSchedule?: string
  exchangeMode?: string
}

export type NegotiationRound = {
  by: string
  at: string
  proposal: Record<string, unknown>
  message?: string
}

export type Negotiation = {
  id: string
  opportunityId?: string
  matchId?: string
  applicationId?: string | null
  parties?: Array<{ userId: string; role: string }>
  status: string
  initialTerms?: NegotiationTerms
  rounds?: NegotiationRound[]
  agreedTerms?: NegotiationTerms
  createdAt?: string
  updatedAt?: string
}

export type Deal = {
  id: string
  negotiationId: string
  opportunityId: string
  title: string
  status: string
  parties: Array<{ userId: string; role: string }>
  terms?: NegotiationTerms
  createdAt: string
  updatedAt: string
}

export type Contract = {
  id: string
  dealId: string
  status: string
  parties: Array<{ userId: string; role: string }>
  terms?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type AuditEntry = {
  id: string
  action: string
  userId?: string
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

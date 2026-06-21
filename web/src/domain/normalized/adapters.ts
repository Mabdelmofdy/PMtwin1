import {
  asLegacyRaw,
  canonicalizeEntityType,
  canonicalizeNegotiationStatus,
  pickFirst,
  pickMatchId,
  pickOptionalString,
  pickParticipants,
  pickString,
  pickTenantFields,
  pickTimestamp,
  resolveCommercialTerms,
  type LegacyRaw,
} from '@/domain/normalized/field-utils.ts'
import type {
  NormalizedApplication,
  NormalizedAuditLog,
  NormalizedCompany,
  NormalizedContract,
  NormalizedDeal,
  NormalizedDealMilestone,
  NormalizedMatch,
  NormalizedNegotiation,
  NormalizedNegotiationRound,
  NormalizedNotification,
  NormalizedOpportunity,
  NormalizedProfile,
  NormalizedUser,
} from '@/domain/normalized/types.ts'
import {
  wrapNormalizedWithValidation,
  type NormalizeOptions,
} from '@/domain/normalized/validation/adapter-hook.ts'
import type { ValidatedNormalizeResult } from '@/domain/normalized/validation/types.ts'
import {
  validateApplication,
  validateAuditLog,
  validateCompany,
  validateContract,
  validateDeal,
  validateMatch,
  validateNegotiation,
  validateNotification,
  validateOpportunity,
  validateUser,
} from '@/domain/normalized/validation/validators.ts'

export type { NormalizeOptions }

function normalizeProfile(raw: LegacyRaw): NormalizedProfile | undefined {
  const profile = pickFirst<LegacyRaw>(raw, ['profile'])
  if (!profile) return undefined
  return {
    name: pickOptionalString(profile, ['name']),
    headline: pickOptionalString(profile, ['headline']),
    type: pickOptionalString(profile, ['type']),
    location: pickOptionalString(profile, ['location']),
    bio: pickOptionalString(profile, ['bio', 'description']),
    description: pickOptionalString(profile, ['description']),
    skills: Array.isArray(profile.skills)
      ? (profile.skills as string[])
      : undefined,
  }
}

function normalizeMilestones(raw: LegacyRaw): NormalizedDealMilestone[] | undefined {
  const list = raw.milestones
  if (!Array.isArray(list)) return undefined
  return list
    .filter(
      (item): item is LegacyRaw =>
        item !== null && typeof item === 'object' && !Array.isArray(item),
    )
    .map((m) => ({
      id: pickString(m, ['id']),
      title: pickString(m, ['title']),
      description: pickOptionalString(m, ['description']),
      dueDate: pickOptionalString(m, ['dueDate']),
      status: pickOptionalString(m, ['status']),
      deliverables: pickOptionalString(m, ['deliverables']),
      submittedAt:
        (pickFirst<string | null>(m, ['submittedAt']) as string | null | undefined) ??
        undefined,
      approvedAt:
        (pickFirst<string | null>(m, ['approvedAt']) as string | null | undefined) ??
        undefined,
      approvedBy: pickOptionalString(m, ['approvedBy']),
    }))
    .filter((m) => m.id.length > 0)
}

function normalizeRounds(raw: LegacyRaw): NormalizedNegotiationRound[] | undefined {
  const list = raw.rounds
  if (!Array.isArray(list)) return undefined
  return list
    .filter(
      (item): item is LegacyRaw =>
        item !== null && typeof item === 'object' && !Array.isArray(item),
    )
    .map((r) => ({
      by: pickString(r, ['by']),
      at: pickString(r, ['at']),
      proposal: (pickFirst<Record<string, unknown>>(r, ['proposal']) ?? {}) as Record<
        string,
        unknown
      >,
      message: pickOptionalString(r, ['message']),
    }))
}

/** Normalize a legacy user record (PlatformUser / POC user JSON). */
export function normalizeUser(raw: unknown): NormalizedUser
export function normalizeUser(
  raw: unknown,
  options: NormalizeOptions & { validation: true },
): ValidatedNormalizeResult<NormalizedUser>
export function normalizeUser(
  raw: unknown,
  options?: NormalizeOptions,
): NormalizedUser | ValidatedNormalizeResult<NormalizedUser> {
  const r = asLegacyRaw(raw)
  const createdAt = pickTimestamp(r, 'createdAt')
  const updatedAt = pickTimestamp(r, 'updatedAt') || createdAt
  const data: NormalizedUser = {
    id: pickString(r, ['id']),
    email: pickString(r, ['email']),
    role: pickString(r, ['role']) || 'professional',
    status: pickString(r, ['status']) || 'pending',
    ...pickTenantFields(r),
    isPublic: pickFirst<boolean>(r, ['isPublic']),
    profile: normalizeProfile(r),
    createdAt,
    updatedAt,
  }
  return wrapNormalizedWithValidation(data, validateUser, options)
}

/** Normalize a legacy company record (same storage shape as user, company profile). */
export function normalizeCompany(raw: unknown): NormalizedCompany
export function normalizeCompany(
  raw: unknown,
  options: NormalizeOptions & { validation: true },
): ValidatedNormalizeResult<NormalizedCompany>
export function normalizeCompany(
  raw: unknown,
  options?: NormalizeOptions,
): NormalizedCompany | ValidatedNormalizeResult<NormalizedCompany> {
  const user = normalizeUser(raw) as NormalizedUser
  const data: NormalizedCompany = {
    ...user,
    role: user.role || 'company_owner',
    profile: {
      ...user.profile,
      type: user.profile?.type ?? 'company',
    },
  }
  return wrapNormalizedWithValidation(data, validateCompany, options)
}

/** Normalize a legacy opportunity record. */
export function normalizeOpportunity(raw: unknown): NormalizedOpportunity
export function normalizeOpportunity(
  raw: unknown,
  options: NormalizeOptions & { validation: true },
): ValidatedNormalizeResult<NormalizedOpportunity>
export function normalizeOpportunity(
  raw: unknown,
  options?: NormalizeOptions,
): NormalizedOpportunity | ValidatedNormalizeResult<NormalizedOpportunity> {
  const r = asLegacyRaw(raw)
  const createdAt = pickTimestamp(r, 'createdAt')
  const updatedAt = pickTimestamp(r, 'updatedAt') || createdAt
  const scope = pickFirst<LegacyRaw>(r, ['scope'])
  const attributes = pickFirst<LegacyRaw>(r, ['attributes'])
  const data: NormalizedOpportunity = {
    id: pickString(r, ['id']),
    title: pickString(r, ['title']),
    description: pickOptionalString(r, ['description']),
    status: pickString(r, ['status']) || 'draft',
    creatorId: pickOptionalString(r, ['creatorId']),
    ...pickTenantFields(r),
    location: pickOptionalString(r, ['location']),
    exchangeMode: pickOptionalString(r, ['exchangeMode']),
    modelType: pickOptionalString(r, ['modelType']),
    intent: pickOptionalString(r, ['intent']),
    scope: scope
      ? {
          coreSkills: Array.isArray(scope.coreSkills)
            ? (scope.coreSkills as string[])
            : undefined,
          sectors: Array.isArray(scope.sectors)
            ? (scope.sectors as string[])
            : undefined,
        }
      : undefined,
    attributes: attributes
      ? {
          coreSkills: Array.isArray(attributes.coreSkills)
            ? (attributes.coreSkills as string[])
            : undefined,
          startDate: pickOptionalString(attributes, ['startDate']),
          tenderDeadline: pickOptionalString(attributes, ['tenderDeadline']),
        }
      : undefined,
    createdAt,
    updatedAt,
  }
  return wrapNormalizedWithValidation(data, validateOpportunity, options)
}

/** Normalize a legacy application record. */
export function normalizeApplication(raw: unknown): NormalizedApplication
export function normalizeApplication(
  raw: unknown,
  options: NormalizeOptions & { validation: true },
): ValidatedNormalizeResult<NormalizedApplication>
export function normalizeApplication(
  raw: unknown,
  options?: NormalizeOptions,
): NormalizedApplication | ValidatedNormalizeResult<NormalizedApplication> {
  const r = asLegacyRaw(raw)
  const createdAt = pickTimestamp(r, 'createdAt')
  const updatedAt = pickTimestamp(r, 'updatedAt') || createdAt
  const data: NormalizedApplication = {
    id: pickString(r, ['id']),
    opportunityId: pickString(r, ['opportunityId']),
    applicantId: pickString(r, ['applicantId']),
    status: pickString(r, ['status']) || 'pending',
    ...pickTenantFields(r),
    proposal: pickOptionalString(r, ['proposal']),
    coverLetter: pickOptionalString(r, ['coverLetter']),
    commercialTerms: resolveCommercialTerms(r),
    matchId: pickMatchId(r),
    matchType: pickOptionalString(r, ['matchType']),
    negotiationId: pickOptionalString(r, ['negotiationId']),
    dealId: pickOptionalString(r, ['dealId']),
    createdAt,
    updatedAt,
  }
  return wrapNormalizedWithValidation(data, validateApplication, options)
}

/**
 * Normalize a legacy PostMatch / match record to canonical Match.
 * Accepts post_matches storage, legacy matches, or audit entity payloads.
 */
export function normalizePostMatch(raw: unknown): NormalizedMatch
export function normalizePostMatch(
  raw: unknown,
  options: NormalizeOptions & { validation: true },
): ValidatedNormalizeResult<NormalizedMatch>
export function normalizePostMatch(
  raw: unknown,
  options?: NormalizeOptions,
): NormalizedMatch | ValidatedNormalizeResult<NormalizedMatch> {
  const r = asLegacyRaw(raw)
  const createdAt = pickTimestamp(r, 'createdAt')
  const updatedAt = pickTimestamp(r, 'updatedAt') || createdAt
  const payloadRaw = pickFirst<LegacyRaw>(r, ['payload'])
  const data: NormalizedMatch = {
    id: pickString(r, ['id']),
    matchType: pickString(r, ['matchType']) || 'one_way',
    status: pickString(r, ['status']) || 'pending',
    matchScore: Number(pickFirst<number>(r, ['matchScore']) ?? 0),
    ...pickTenantFields(r),
    runId: pickOptionalString(r, ['runId']),
    participants: pickParticipants(r),
    payload: payloadRaw
      ? {
          needOpportunityId: pickOptionalString(payloadRaw, ['needOpportunityId']),
          offerOpportunityId: pickOptionalString(payloadRaw, ['offerOpportunityId']),
          leadNeedId: pickOptionalString(payloadRaw, ['leadNeedId']),
          breakdown: pickFirst<Record<string, number>>(payloadRaw, ['breakdown']),
          valueAnalysis: payloadRaw.valueAnalysis,
        }
      : undefined,
    expiresAt: pickOptionalString(r, ['expiresAt']),
    isReplacement: pickFirst<boolean>(r, ['isReplacement']) ?? false,
    dealId: pickOptionalString(r, ['dealId']),
    negotiationId: pickOptionalString(r, ['negotiationId']),
    createdAt,
    updatedAt,
  }
  return wrapNormalizedWithValidation(data, validateMatch, options)
}

/** Alias — Match is canonical; PostMatch is the legacy storage name. */
export const normalizeMatch = normalizePostMatch

/** Normalize a legacy negotiation record. */
export function normalizeNegotiation(raw: unknown): NormalizedNegotiation
export function normalizeNegotiation(
  raw: unknown,
  options: NormalizeOptions & { validation: true },
): ValidatedNormalizeResult<NormalizedNegotiation>
export function normalizeNegotiation(
  raw: unknown,
  options?: NormalizeOptions,
): NormalizedNegotiation | ValidatedNormalizeResult<NormalizedNegotiation> {
  const r = asLegacyRaw(raw)
  const createdAt = pickTimestamp(r, 'createdAt')
  const updatedAt = pickTimestamp(r, 'updatedAt') || createdAt
  const rawStatus = pickString(r, ['status']) || 'active'
  const applicationIdRaw = r.applicationId
  const data: NormalizedNegotiation = {
    id: pickString(r, ['id']),
    opportunityId: pickOptionalString(r, ['opportunityId']),
    matchId: pickMatchId(r),
    applicationId:
      applicationIdRaw === null || applicationIdRaw === undefined
        ? null
        : String(applicationIdRaw),
    status: canonicalizeNegotiationStatus(rawStatus),
    ...pickTenantFields(r),
    participants: pickParticipants(r),
    commercialTerms: resolveCommercialTerms(r),
    rounds: normalizeRounds(r),
    expiresAt: pickOptionalString(r, ['expiresAt']),
    createdAt,
    updatedAt,
  }
  return wrapNormalizedWithValidation(data, validateNegotiation, options)
}

/** Normalize a legacy deal record. */
export function normalizeDeal(raw: unknown): NormalizedDeal
export function normalizeDeal(
  raw: unknown,
  options: NormalizeOptions & { validation: true },
): ValidatedNormalizeResult<NormalizedDeal>
export function normalizeDeal(
  raw: unknown,
  options?: NormalizeOptions,
): NormalizedDeal | ValidatedNormalizeResult<NormalizedDeal> {
  const r = asLegacyRaw(raw)
  const createdAt = pickTimestamp(r, 'createdAt')
  const updatedAt = pickTimestamp(r, 'updatedAt') || createdAt
  const opportunityIds = Array.isArray(r.opportunityIds)
    ? (r.opportunityIds as string[])
    : undefined
  const deliverables = r.deliverables
  const data: NormalizedDeal = {
    id: pickString(r, ['id']),
    negotiationId: pickString(r, ['negotiationId']),
    opportunityId: pickString(r, ['opportunityId']),
    opportunityIds,
    matchId: pickMatchId(r) ?? null,
    applicationId: pickOptionalString(r, ['applicationId']) ?? null,
    matchType: pickOptionalString(r, ['matchType']),
    title: pickString(r, ['title']),
    status: pickString(r, ['status']) || 'draft',
    ...pickTenantFields(r),
    participants: pickParticipants(r),
    commercialTerms: resolveCommercialTerms(r),
    scope: pickOptionalString(r, ['scope']),
    deliverables:
      typeof deliverables === 'string' || Array.isArray(deliverables)
        ? (deliverables as string | string[])
        : undefined,
    milestones: normalizeMilestones(r),
    timeline: pickFirst<{ start?: string; end?: string }>(r, ['timeline']),
    exchangeMode: pickOptionalString(r, ['exchangeMode']),
    contractId: pickOptionalString(r, ['contractId']) ?? null,
    completedAt: pickOptionalString(r, ['completedAt']) ?? null,
    closedAt: pickOptionalString(r, ['closedAt']) ?? null,
    createdAt,
    updatedAt,
  }
  return wrapNormalizedWithValidation(data, validateDeal, options)
}

/** Normalize a legacy contract record. */
export function normalizeContract(raw: unknown): NormalizedContract
export function normalizeContract(
  raw: unknown,
  options: NormalizeOptions & { validation: true },
): ValidatedNormalizeResult<NormalizedContract>
export function normalizeContract(
  raw: unknown,
  options?: NormalizeOptions,
): NormalizedContract | ValidatedNormalizeResult<NormalizedContract> {
  const r = asLegacyRaw(raw)
  const createdAt = pickTimestamp(r, 'createdAt')
  const updatedAt = pickTimestamp(r, 'updatedAt') || createdAt
  const opportunityIds = Array.isArray(r.opportunityIds)
    ? (r.opportunityIds as string[])
    : undefined
  const data: NormalizedContract = {
    id: pickString(r, ['id']),
    dealId: pickString(r, ['dealId']),
    opportunityId: pickOptionalString(r, ['opportunityId']),
    opportunityIds,
    matchId: pickMatchId(r) ?? null,
    applicationId: pickOptionalString(r, ['applicationId']) ?? null,
    negotiationId: pickOptionalString(r, ['negotiationId']) ?? null,
    status: pickString(r, ['status']) || 'pending',
    ...pickTenantFields(r),
    participants: pickParticipants(r),
    commercialTerms: resolveCommercialTerms(r),
    scope: pickOptionalString(r, ['scope']),
    paymentMode: pickOptionalString(r, ['paymentMode']),
    signedAt: pickOptionalString(r, ['signedAt']) ?? null,
    version: pickFirst<number>(r, ['version']),
    createdAt,
    updatedAt,
  }
  return wrapNormalizedWithValidation(data, validateContract, options)
}

/** Normalize a legacy notification (AppNotification) record. */
export function normalizeNotification(raw: unknown): NormalizedNotification
export function normalizeNotification(
  raw: unknown,
  options: NormalizeOptions & { validation: true },
): ValidatedNormalizeResult<NormalizedNotification>
export function normalizeNotification(
  raw: unknown,
  options?: NormalizeOptions,
): NormalizedNotification | ValidatedNormalizeResult<NormalizedNotification> {
  const r = asLegacyRaw(raw)
  const createdAt = pickTimestamp(r, 'createdAt') || pickTimestamp(r, 'auditCreatedAt')
  const updatedAt = pickTimestamp(r, 'updatedAt') || createdAt
  const data: NormalizedNotification = {
    id: pickString(r, ['id']),
    userId: pickString(r, ['userId']),
    type: pickOptionalString(r, ['type']),
    title: pickString(r, ['title']),
    message: pickString(r, ['message']),
    link: pickOptionalString(r, ['link']),
    read: pickFirst<boolean>(r, ['read']) ?? false,
    entityType: canonicalizeEntityType(pickOptionalString(r, ['entityType'])),
    entityId: pickOptionalString(r, ['entityId']),
    ...pickTenantFields(r),
    createdAt,
    updatedAt,
  }
  return wrapNormalizedWithValidation(data, validateNotification, options)
}

/** Normalize a legacy audit log (AuditEntry) record. */
export function normalizeAuditLog(raw: unknown): NormalizedAuditLog
export function normalizeAuditLog(
  raw: unknown,
  options: NormalizeOptions & { validation: true },
): ValidatedNormalizeResult<NormalizedAuditLog>
export function normalizeAuditLog(
  raw: unknown,
  options?: NormalizeOptions,
): NormalizedAuditLog | ValidatedNormalizeResult<NormalizedAuditLog> {
  const r = asLegacyRaw(raw)
  const createdAt = pickTimestamp(r, 'auditCreatedAt')
  const updatedAt = pickTimestamp(r, 'updatedAt') || createdAt
  const data: NormalizedAuditLog = {
    id: pickString(r, ['id']),
    action: pickString(r, ['action']),
    userId: pickOptionalString(r, ['userId']),
    actorType: pickOptionalString(r, ['actorType']),
    entityType: canonicalizeEntityType(pickOptionalString(r, ['entityType'])),
    entityId: pickOptionalString(r, ['entityId']),
    details: pickFirst<Record<string, unknown>>(r, ['details']),
    requestId: pickOptionalString(r, ['requestId']),
    ipAddress: pickOptionalString(r, ['ipAddress']),
    ...pickTenantFields(r),
    createdAt,
    updatedAt,
  }
  return wrapNormalizedWithValidation(data, validateAuditLog, options)
}

/** Batch helpers — return new arrays, never mutate input. */
export function normalizeUsers(items: unknown[]): NormalizedUser[] {
  return items.map((item) => normalizeUser(item) as NormalizedUser)
}

export function normalizeCompanies(items: unknown[]): NormalizedCompany[] {
  return items.map((item) => normalizeCompany(item) as NormalizedCompany)
}

export function normalizeOpportunities(items: unknown[]): NormalizedOpportunity[] {
  return items.map((item) => normalizeOpportunity(item) as NormalizedOpportunity)
}

export function normalizeApplications(items: unknown[]): NormalizedApplication[] {
  return items.map((item) => normalizeApplication(item) as NormalizedApplication)
}

export function normalizePostMatches(items: unknown[]): NormalizedMatch[] {
  return items.map((item) => normalizePostMatch(item) as NormalizedMatch)
}

export function normalizeNegotiations(items: unknown[]): NormalizedNegotiation[] {
  return items.map((item) => normalizeNegotiation(item) as NormalizedNegotiation)
}

export function normalizeDeals(items: unknown[]): NormalizedDeal[] {
  return items.map((item) => normalizeDeal(item) as NormalizedDeal)
}

export function normalizeContracts(items: unknown[]): NormalizedContract[] {
  return items.map((item) => normalizeContract(item) as NormalizedContract)
}

export function normalizeNotifications(items: unknown[]): NormalizedNotification[] {
  return items.map((item) => normalizeNotification(item) as NormalizedNotification)
}

export function normalizeAuditLogs(items: unknown[]): NormalizedAuditLog[] {
  return items.map((item) => normalizeAuditLog(item) as NormalizedAuditLog)
}

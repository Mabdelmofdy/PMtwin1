import { z } from 'zod'
import {
  CommercialTermsSchema,
  IdSchema,
  ParticipantSchema,
  ProfileSchema,
  StatusSchema,
  TimestampSchema,
} from '@/domain/normalized/schemas/base.ts'

export const UserSchema = z
  .object({
    id: IdSchema,
    email: z.string().optional().transform((v) => v ?? ''),
    role: z.string().optional().transform((v) => v ?? 'professional'),
    status: StatusSchema,
    tenantId: z.string().optional(),
    organizationId: z.string().optional(),
    isPublic: z.boolean().optional(),
    profile: ProfileSchema,
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .passthrough()

export const CompanySchema = z
  .object({
    id: IdSchema,
    email: z.string().optional().transform((v) => v ?? ''),
    role: z.string().optional().transform((v) => v ?? 'company_owner'),
    status: StatusSchema,
    tenantId: z.string().optional(),
    organizationId: z.string().optional(),
    isPublic: z.boolean().optional(),
    profile: ProfileSchema,
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .passthrough()

export const OpportunitySchema = z
  .object({
    id: IdSchema,
    title: z.string().optional().transform((v) => v ?? ''),
    description: z.string().optional(),
    status: StatusSchema,
    creatorId: z.string().optional(),
    tenantId: z.string().optional(),
    organizationId: z.string().optional(),
    location: z.string().optional(),
    exchangeMode: z.string().optional(),
    modelType: z.string().optional(),
    intent: z.string().optional(),
    scope: z
      .object({
        coreSkills: z.array(z.string()).optional(),
        sectors: z.array(z.string()).optional(),
      })
      .passthrough()
      .optional(),
    attributes: z
      .object({
        coreSkills: z.array(z.string()).optional(),
        startDate: z.string().optional(),
        tenderDeadline: z.string().optional(),
      })
      .passthrough()
      .optional(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .passthrough()

export const ApplicationSchema = z
  .object({
    id: IdSchema,
    opportunityId: IdSchema,
    applicantId: IdSchema,
    status: StatusSchema,
    tenantId: z.string().optional(),
    organizationId: z.string().optional(),
    proposal: z.string().optional(),
    coverLetter: z.string().optional(),
    commercialTerms: CommercialTermsSchema,
    matchId: z.string().optional(),
    matchType: z.string().optional(),
    negotiationId: z.string().optional(),
    dealId: z.string().optional(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .passthrough()

export const MatchSchema = z
  .object({
    id: IdSchema,
    matchType: z.string().optional().transform((v) => v ?? 'one_way'),
    status: StatusSchema,
    matchScore: z.number().optional().transform((v) => v ?? 0),
    tenantId: z.string().optional(),
    organizationId: z.string().optional(),
    runId: z.string().optional(),
    participants: z.array(ParticipantSchema).optional().transform((v) => v ?? []),
    payload: z
      .object({
        needOpportunityId: z.string().optional(),
        offerOpportunityId: z.string().optional(),
        leadNeedId: z.string().optional(),
        breakdown: z.record(z.string(), z.number()).optional(),
        valueAnalysis: z.unknown().optional(),
      })
      .passthrough()
      .optional(),
    expiresAt: z.string().optional(),
    isReplacement: z.boolean().optional(),
    dealId: z.string().optional(),
    negotiationId: z.string().optional(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .passthrough()

export const NegotiationRoundSchema = z
  .object({
    by: z.string().optional().transform((v) => v ?? ''),
    at: z.string().optional().transform((v) => v ?? ''),
    proposal: z.record(z.string(), z.unknown()).optional().transform((v) => v ?? {}),
    message: z.string().optional(),
  })
  .passthrough()

export const NegotiationSchema = z
  .object({
    id: IdSchema,
    opportunityId: z.string().optional(),
    matchId: z.string().optional(),
    applicationId: z.union([z.string(), z.null()]).optional(),
    status: StatusSchema,
    tenantId: z.string().optional(),
    organizationId: z.string().optional(),
    participants: z.array(ParticipantSchema).optional().transform((v) => v ?? []),
    commercialTerms: CommercialTermsSchema,
    rounds: z.array(NegotiationRoundSchema).optional(),
    expiresAt: z.string().optional(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .passthrough()

export const DealMilestoneSchema = z
  .object({
    id: IdSchema,
    title: z.string().optional().transform((v) => v ?? ''),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    status: z.string().optional(),
    deliverables: z.string().optional(),
    submittedAt: z.union([z.string(), z.null()]).optional(),
    approvedAt: z.union([z.string(), z.null()]).optional(),
    approvedBy: z.string().optional(),
  })
  .passthrough()

export const DealSchema = z
  .object({
    id: IdSchema,
    negotiationId: IdSchema,
    opportunityId: IdSchema,
    opportunityIds: z.array(z.string()).optional(),
    matchId: z.union([z.string(), z.null()]).optional(),
    applicationId: z.union([z.string(), z.null()]).optional(),
    matchType: z.string().optional(),
    title: z.string().optional().transform((v) => v ?? ''),
    status: StatusSchema,
    tenantId: z.string().optional(),
    organizationId: z.string().optional(),
    participants: z.array(ParticipantSchema).optional().transform((v) => v ?? []),
    commercialTerms: CommercialTermsSchema,
    scope: z.string().optional(),
    deliverables: z.union([z.string(), z.array(z.string())]).optional(),
    milestones: z.array(DealMilestoneSchema).optional(),
    timeline: z
      .object({
        start: z.string().optional(),
        end: z.string().optional(),
      })
      .passthrough()
      .optional(),
    exchangeMode: z.string().optional(),
    contractId: z.union([z.string(), z.null()]).optional(),
    completedAt: z.union([z.string(), z.null()]).optional(),
    closedAt: z.union([z.string(), z.null()]).optional(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .passthrough()

export const ContractSchema = z
  .object({
    id: IdSchema,
    dealId: IdSchema,
    opportunityId: z.string().optional(),
    opportunityIds: z.array(z.string()).optional(),
    matchId: z.union([z.string(), z.null()]).optional(),
    applicationId: z.union([z.string(), z.null()]).optional(),
    negotiationId: z.union([z.string(), z.null()]).optional(),
    status: StatusSchema,
    tenantId: z.string().optional(),
    organizationId: z.string().optional(),
    participants: z.array(ParticipantSchema).optional().transform((v) => v ?? []),
    commercialTerms: CommercialTermsSchema,
    scope: z.string().optional(),
    paymentMode: z.string().optional(),
    signedAt: z.union([z.string(), z.null()]).optional(),
    version: z.number().optional(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .passthrough()

export const NotificationSchema = z
  .object({
    id: IdSchema,
    userId: IdSchema,
    type: z.string().optional(),
    title: z.string().optional().transform((v) => v ?? ''),
    message: z.string().optional().transform((v) => v ?? ''),
    link: z.string().optional(),
    read: z.boolean().optional().transform((v) => v ?? false),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    tenantId: z.string().optional(),
    organizationId: z.string().optional(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .passthrough()

export const AuditLogSchema = z
  .object({
    id: IdSchema,
    action: z.string().optional().transform((v) => v ?? ''),
    userId: z.string().optional(),
    actorType: z.string().optional(),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    details: z.record(z.string(), z.unknown()).optional(),
    requestId: z.string().optional(),
    ipAddress: z.string().optional(),
    tenantId: z.string().optional(),
    organizationId: z.string().optional(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .passthrough()

import { z } from 'zod'

/** Legacy-safe ID — accepts seed prefixes, timestamp IDs, UUIDs. */
export const IdSchema = z.string()

/** ISO timestamp or legacy empty string from adapters. */
export const TimestampSchema = z.string()

/**
 * Non-strict status — known literals documented, any string accepted.
 * Never use z.enum() alone; always allow arbitrary strings for seed compat.
 */
export const StatusSchema = z
  .union([
    z.literal('pending'),
    z.literal('active'),
    z.literal('draft'),
    z.literal('published'),
    z.literal('agreed'),
    z.literal('completed'),
    z.string(),
  ])
  .optional()
  .transform((v) => v ?? '')

export const TenantSchema = z
  .object({
    tenantId: z.string().optional(),
    organizationId: z.string().optional(),
  })
  .passthrough()

export const CommercialTermsSchema = z
  .object({
    amount: z.number().optional(),
    currency: z.string().optional(),
    duration: z.string().optional(),
    paymentSchedule: z.string().optional(),
    profitSplit: z.union([z.number(), z.string()]).optional(),
    exchangeMode: z.string().optional(),
  })
  .passthrough()
  .optional()

export const ParticipantSchema = z
  .object({
    userId: IdSchema,
    role: z.string().optional().transform((v) => v ?? 'participant'),
    opportunityId: z.string().optional(),
    participantStatus: z.string().optional(),
    approvalStatus: z.string().optional(),
    respondedAt: z.union([z.string(), z.null()]).optional(),
    signedAt: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough()

export const ProfileSchema = z
  .object({
    name: z.string().optional(),
    headline: z.string().optional(),
    type: z.string().optional(),
    location: z.string().optional(),
    bio: z.string().optional(),
    description: z.string().optional(),
    skills: z.array(z.string()).optional(),
  })
  .passthrough()
  .optional()

export const TimestampsSchema = z
  .object({
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .passthrough()

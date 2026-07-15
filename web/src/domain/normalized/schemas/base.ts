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
    phone: z.string().optional(),
    website: z.string().optional(),
    linkedIn: z.string().optional(),
    services: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    certifications: z.array(z.string()).optional(),
    collaborationPreferences: z.array(z.string()).optional(),
    preferredWorkMode: z.string().optional(),
    availability: z.string().optional(),
    yearsExperience: z.number().optional(),
    workHistory: z.array(z.string()).optional(),
    education: z.array(z.string()).optional(),
    portfolio: z.array(z.string()).optional(),
    testimonials: z.array(z.string()).optional(),
    teamSize: z.string().optional(),
    employeeCount: z.string().optional(),
    businessCategory: z.string().optional(),
    sectors: z.array(z.string()).optional(),
    projectCategories: z.array(z.string()).optional(),
    contactPerson: z.string().optional(),
    coverageAreas: z.array(z.string()).optional(),
    financialCapacity: z.number().optional(),
    visibility: z
      .object({
        showPhone: z.boolean().optional(),
        showWebsite: z.boolean().optional(),
        showLinkedIn: z.boolean().optional(),
      })
      .optional(),
  })
  .passthrough()
  .optional()

export const TimestampsSchema = z
  .object({
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .passthrough()

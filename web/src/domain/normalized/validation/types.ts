import type { z } from 'zod'

/** Flat, serializable Zod error summary — safe for logging/diagnostics. */
export type ValidationErrorSummary = {
  path: string
  message: string
  code: string
}

export type SafeValidationSuccess<T> = {
  success: true
  data: T
}

export type SafeValidationFailure = {
  success: false
  data: null
  errors: ValidationErrorSummary[]
}

export type SafeValidationResult<T> =
  | SafeValidationSuccess<T>
  | SafeValidationFailure

/** Result when validation is attached to normalization — data is never dropped. */
export type ValidatedNormalizeResult<T> = {
  data: T
  valid: boolean
  errors?: ValidationErrorSummary[]
}

export type EntityKind =
  | 'user'
  | 'company'
  | 'opportunity'
  | 'application'
  | 'match'
  | 'negotiation'
  | 'deal'
  | 'contract'
  | 'notification'
  | 'auditLog'

export type EntityValidationRecord = {
  entityKind: EntityKind
  entityId: string
  valid: boolean
  errors: ValidationErrorSummary[]
  missingFields: string[]
  statusValue?: string
}

export type EntityHealthStats = {
  total: number
  valid: number
  invalid: number
  validPercent: number
  missingFieldsCount: number
  statusInconsistencies: number
}

export type RelationshipAnomaly = {
  entityKind: EntityKind
  entityId: string
  field: string
  message: string
  severity: 'warning' | 'info'
}

export type DomainHealthReport = {
  checkedAt: string
  mode: 'safe' | 'strict'
  overallHealthScore: number
  byEntity: Record<EntityKind, EntityHealthStats>
  records: EntityValidationRecord[]
  relationshipAnomalies: RelationshipAnomaly[]
  errorSummary: {
    totalErrors: number
    byEntity: Record<EntityKind, number>
  }
}

export type ValidationMode = 'safe' | 'strict'

export type ZodSchemaLike = z.ZodType

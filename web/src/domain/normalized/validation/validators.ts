import type {
  NormalizedApplication,
  NormalizedAuditLog,
  NormalizedCompany,
  NormalizedContract,
  NormalizedDeal,
  NormalizedMatch,
  NormalizedNegotiation,
  NormalizedNotification,
  NormalizedOpportunity,
  NormalizedUser,
} from '@/domain/normalized/types.ts'
import {
  ApplicationSchema,
  AuditLogSchema,
  CompanySchema,
  ContractSchema,
  DealSchema,
  MatchSchema,
  NegotiationSchema,
  NotificationSchema,
  OpportunitySchema,
  UserSchema,
} from '@/domain/normalized/schemas/index.ts'
import {
  getValidationMode,
  validateSafe,
  validateStrict,
} from '@/domain/normalized/validation/mode.ts'
import type {
  SafeValidationResult,
  ValidatedNormalizeResult,
} from '@/domain/normalized/validation/types.ts'

export function validateUser(
  entity: NormalizedUser,
): SafeValidationResult<NormalizedUser> {
  return validateSafe(UserSchema, entity)
}

export function validateCompany(
  entity: NormalizedCompany,
): SafeValidationResult<NormalizedCompany> {
  return validateSafe(CompanySchema, entity)
}

export function validateOpportunity(
  entity: NormalizedOpportunity,
): SafeValidationResult<NormalizedOpportunity> {
  return validateSafe(OpportunitySchema, entity)
}

export function validateApplication(
  entity: NormalizedApplication,
): SafeValidationResult<NormalizedApplication> {
  return validateSafe(ApplicationSchema, entity)
}

export function validateMatch(
  entity: NormalizedMatch,
): SafeValidationResult<NormalizedMatch> {
  return validateSafe(MatchSchema, entity)
}

export function validateNegotiation(
  entity: NormalizedNegotiation,
): SafeValidationResult<NormalizedNegotiation> {
  return validateSafe(NegotiationSchema, entity)
}

export function validateDeal(
  entity: NormalizedDeal,
): SafeValidationResult<NormalizedDeal> {
  return validateSafe(DealSchema, entity)
}

export function validateContract(
  entity: NormalizedContract,
): SafeValidationResult<NormalizedContract> {
  return validateSafe(ContractSchema, entity)
}

export function validateNotification(
  entity: NormalizedNotification,
): SafeValidationResult<NormalizedNotification> {
  return validateSafe(NotificationSchema, entity)
}

export function validateAuditLog(
  entity: NormalizedAuditLog,
): SafeValidationResult<NormalizedAuditLog> {
  return validateSafe(AuditLogSchema, entity)
}

/** Strict validators — throw on failure; CI / debug only. */
export function validateUserStrict(entity: NormalizedUser): NormalizedUser {
  return validateStrict(UserSchema, entity)
}

export function validateCompanyStrict(
  entity: NormalizedCompany,
): NormalizedCompany {
  return validateStrict(CompanySchema, entity)
}

export function validateOpportunityStrict(
  entity: NormalizedOpportunity,
): NormalizedOpportunity {
  return validateStrict(OpportunitySchema, entity)
}

export function validateApplicationStrict(
  entity: NormalizedApplication,
): NormalizedApplication {
  return validateStrict(ApplicationSchema, entity)
}

export function validateMatchStrict(entity: NormalizedMatch): NormalizedMatch {
  return validateStrict(MatchSchema, entity)
}

export function validateNegotiationStrict(
  entity: NormalizedNegotiation,
): NormalizedNegotiation {
  return validateStrict(NegotiationSchema, entity)
}

export function validateDealStrict(entity: NormalizedDeal): NormalizedDeal {
  return validateStrict(DealSchema, entity)
}

export function validateContractStrict(
  entity: NormalizedContract,
): NormalizedContract {
  return validateStrict(ContractSchema, entity)
}

export function validateNotificationStrict(
  entity: NormalizedNotification,
): NormalizedNotification {
  return validateStrict(NotificationSchema, entity)
}

export function validateAuditLogStrict(
  entity: NormalizedAuditLog,
): NormalizedAuditLog {
  return validateStrict(AuditLogSchema, entity)
}

/**
 * Attach validation metadata to a normalized entity.
 * Always returns `data` — validation never strips or replaces the normalized output.
 */
export function attachValidation<T>(
  data: T,
  result: SafeValidationResult<T>,
): ValidatedNormalizeResult<T> {
  return {
    data,
    valid: result.success,
    errors: result.success ? undefined : result.errors,
  }
}

/** Run strict validation only when mode is strict; otherwise no-op return. */
export function maybeStrictValidate<T>(
  schemaParse: () => T,
  data: T,
): T {
  if (getValidationMode() === 'strict') {
    return schemaParse()
  }
  return data
}

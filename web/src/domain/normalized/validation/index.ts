export type {
  DomainHealthReport,
  EntityHealthStats,
  EntityKind,
  EntityValidationRecord,
  RelationshipAnomaly,
  SafeValidationFailure,
  SafeValidationResult,
  SafeValidationSuccess,
  ValidatedNormalizeResult,
  ValidationErrorSummary,
  ValidationMode,
} from '@/domain/normalized/validation/types.ts'

export {
  DEFAULT_VALIDATION_MODE,
  getValidationMode,
  resetValidationMode,
  setValidationMode,
  summarizeZodError,
  validateSafe,
  validateStrict,
} from '@/domain/normalized/validation/mode.ts'

export {
  attachValidation,
  maybeStrictValidate,
  validateApplication,
  validateApplicationStrict,
  validateAuditLog,
  validateAuditLogStrict,
  validateCompany,
  validateCompanyStrict,
  validateContract,
  validateContractStrict,
  validateDeal,
  validateDealStrict,
  validateMatch,
  validateMatchStrict,
  validateNegotiation,
  validateNegotiationStrict,
  validateNotification,
  validateNotificationStrict,
  validateOpportunity,
  validateOpportunityStrict,
  validateUser,
  validateUserStrict,
} from '@/domain/normalized/validation/validators.ts'

export {
  buildDomainHealthReport,
  buildEntityHealthStats,
  collectValidationErrors,
  computeDomainHealthScore,
  detectMissingFields,
  detectRelationshipAnomalies,
  groupErrorsByEntity,
  isStatusInconsistent,
  logValidationSummary,
} from '@/domain/normalized/validation/diagnostics.ts'

export type { CollectValidationInput } from '@/domain/normalized/validation/diagnostics.ts'

export { scanNormalizedDomainHealth } from '@/domain/normalized/validation/health-scan.ts'

export type { NormalizeOptions } from '@/domain/normalized/validation/adapter-hook.ts'

export { wrapNormalizedWithValidation } from '@/domain/normalized/validation/adapter-hook.ts'

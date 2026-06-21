import type { SafeValidationResult, ValidatedNormalizeResult } from '@/domain/normalized/validation/types.ts'
import { attachValidation } from '@/domain/normalized/validation/validators.ts'

export type NormalizeOptions = {
  /** When true, attach non-blocking validation metadata alongside normalized data. */
  validation?: boolean
}

/**
 * Wrap a normalized entity with optional validation diagnostics.
 * Validation failure never replaces or blocks `data`.
 */
export function wrapNormalizedWithValidation<T>(
  data: T,
  validate: (entity: T) => SafeValidationResult<T>,
  options?: NormalizeOptions,
): T | ValidatedNormalizeResult<T> {
  if (!options?.validation) return data
  return attachValidation(data, validate(data))
}

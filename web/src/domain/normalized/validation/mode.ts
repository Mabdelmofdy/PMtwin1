import type { z } from 'zod'
import type {
  SafeValidationResult,
  ValidationErrorSummary,
  ValidationMode,
} from '@/domain/normalized/validation/types.ts'

/** Default — never throws, never blocks normalization. */
export const DEFAULT_VALIDATION_MODE: ValidationMode = 'safe'

/** Opt-in strict mode for CI / debugging only. */
let runtimeValidationMode: ValidationMode = DEFAULT_VALIDATION_MODE

export function getValidationMode(): ValidationMode {
  return runtimeValidationMode
}

export function setValidationMode(mode: ValidationMode): void {
  runtimeValidationMode = mode
}

export function resetValidationMode(): void {
  runtimeValidationMode = DEFAULT_VALIDATION_MODE
}

export function summarizeZodError(error: z.ZodError): ValidationErrorSummary[] {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : '(root)',
    message: issue.message,
    code: issue.code,
  }))
}

export function validateSafe<T>(
  schema: z.ZodType<T>,
  data: T,
): SafeValidationResult<T> {
  try {
    const result = schema.safeParse(data)
    if (result.success) {
      return { success: true, data }
    }
    return {
      success: false,
      data: null,
      errors: summarizeZodError(result.error),
    }
  } catch {
    return {
      success: false,
      data: null,
      errors: [
        {
          path: '(root)',
          message: 'Unexpected validation failure',
          code: 'custom',
        },
      ],
    }
  }
}

/** Strict parse — throws ZodError. Use in CI/scripts only. */
export function validateStrict<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data)
}

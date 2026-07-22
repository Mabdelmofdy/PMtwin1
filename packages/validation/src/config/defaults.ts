import type { ValidationConfig } from '../types.ts'

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  minimumBudget: 1,
  retentionMax: 20,
  maxRetentionPercent: 20,
  vatMax: 100,
  maxVatPercent: 100,
  profitShareMin: 0,
  profitShareMax: 100,
  advancePaymentMaxPercent: 100,
  warningStartWithinHours: 48,
  duplicateSimilarityThreshold: 0.85,
  maxPackageCount: 50,
  titleMaxLength: 150,
  descriptionMaxLength: 2000,
  skillLevelMinYears: {
    // Creation 3.0 UI levels (StructuredSkillsEditor)
    basic: 0,
    intermediate: 2,
    expert: 5,
    // Legacy aliases
    junior: 0,
    'mid-level': 2,
    mid: 2,
    senior: 5,
  },
}

export function mergeValidationConfig(
  override?: Partial<ValidationConfig>,
): ValidationConfig {
  if (!override) return DEFAULT_VALIDATION_CONFIG
  return {
    ...DEFAULT_VALIDATION_CONFIG,
    ...override,
    skillLevelMinYears: {
      ...DEFAULT_VALIDATION_CONFIG.skillLevelMinYears,
      ...(override.skillLevelMinYears ?? {}),
    },
  }
}

/** Allocation-specific validation helpers. */

import type {
  CommercialAllocationMethod,
  OpportunityCommercialStructure,
} from './types.ts'
import type { CommercialValidationIssue } from './validation.ts'

export function validateAllocation(
  structure: OpportunityCommercialStructure,
): CommercialValidationIssue[] {
  const method: CommercialAllocationMethod =
    structure.allocationMethod ?? 'not_applicable'
  const enabled = structure.components.filter((c) => c.enabled)
  const issues: CommercialValidationIssue[] = []

  if (method === 'not_applicable' || enabled.length <= 1) {
    return issues
  }

  if (method === 'percentage') {
    const total = enabled.reduce(
      (sum, c) => sum + (c.allocationPercentage ?? 0),
      0,
    )
    if (Math.abs(total - 100) > 0.01) {
      issues.push({
        severity: 'warning',
        code: 'ALLOCATION_PERCENTAGE_TOTAL',
        message: `Percentage allocation must equal 100% (currently ${total}%).`,
      })
    }
  }

  if (method === 'fixed') {
    for (const c of enabled) {
      if (c.allocationAmount?.amount == null) {
        issues.push({
          severity: 'warning',
          code: 'ALLOCATION_FIXED_MISSING',
          message: `${c.title}: add a fixed allocation amount.`,
          componentId: c.id,
          field: 'allocationAmount',
        })
      }
    }
  }

  // mixed: do not force total to 100%
  return issues
}

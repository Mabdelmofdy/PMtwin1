/** Draft / soft validation for commercial structure (does not replace publish validation). */

import type {
  CashCommercialComponent,
  OpportunityCommercialStructure,
} from './types.ts'

export type CommercialValidationIssue = {
  severity: 'error' | 'warning'
  code: string
  message: string
  componentId?: string
  field?: string
}

export function validateCommercialStructureDraft(
  structure: OpportunityCommercialStructure,
): CommercialValidationIssue[] {
  const issues: CommercialValidationIssue[] = []
  const enabled = structure.components.filter((c) => c.enabled)

  if (structure.allocationMethod === 'percentage' && enabled.length > 1) {
    const total = enabled.reduce(
      (sum, c) => sum + (c.allocationPercentage ?? 0),
      0,
    )
    if (Math.abs(total - 100) > 0.01) {
      issues.push({
        severity: 'warning',
        code: 'ALLOCATION_PERCENTAGE_TOTAL',
        message: `Percentage allocation totals ${total}% (expected 100%).`,
      })
    }
    for (const c of enabled) {
      const pct = c.allocationPercentage
      if (pct != null && (pct < 0 || pct > 100)) {
        issues.push({
          severity: 'warning',
          code: 'ALLOCATION_PERCENTAGE_RANGE',
          message: `${c.title}: allocation percentage must be between 0 and 100.`,
          componentId: c.id,
          field: 'allocationPercentage',
        })
      }
    }
  }

  for (const c of enabled) {
    if (c.type === 'cash') {
      issues.push(...validateCashComponent(c))
    }
    if (c.type === 'barter' && !c.valuationMethod && c.estimatedValue == null) {
      issues.push({
        severity: 'warning',
        code: 'BARTER_VALUATION',
        message: 'Barter: add a valuation method or estimated value.',
        componentId: c.id,
        field: 'valuationMethod',
      })
    }
    if (c.type === 'profit_sharing' && !c.calculationBasis) {
      issues.push({
        severity: 'warning',
        code: 'PROFIT_CALCULATION_BASIS',
        message: 'Profit Sharing: add a calculation basis.',
        componentId: c.id,
        field: 'calculationBasis',
      })
    }
    if (c.type === 'revenue_sharing' && !c.revenueDefinition) {
      issues.push({
        severity: 'warning',
        code: 'REVENUE_DEFINITION',
        message: 'Revenue Sharing: add a revenue definition.',
        componentId: c.id,
        field: 'revenueDefinition',
      })
    }
    if (
      c.type === 'equity'
      && c.equityPercentage == null
      && c.equityType !== 'to_be_negotiated'
    ) {
      issues.push({
        severity: 'warning',
        code: 'EQUITY_PERCENTAGE',
        message: 'Equity: add an equity percentage or mark as to be negotiated.',
        componentId: c.id,
        field: 'equityPercentage',
      })
    }
  }

  return issues
}

function validateCashComponent(
  component: CashCommercialComponent,
): CommercialValidationIssue[] {
  const issues: CommercialValidationIssue[] = []
  const schedule = component.paymentSchedule ?? []
  if (schedule.length === 0) return issues

  const pctItems = schedule.filter((item) => item.percentage != null)
  if (pctItems.length > 0) {
    const total = pctItems.reduce((sum, item) => sum + (item.percentage ?? 0), 0)
    if (Math.abs(total - 100) > 0.01) {
      issues.push({
        severity: 'warning',
        code: 'CASH_PAYMENT_PERCENTAGE_TOTAL',
        message: `Cash payment schedule percentages total ${total}% (expected 100%).`,
        componentId: component.id,
        field: 'paymentSchedule',
      })
    }
  }

  const triggers = new Map<string, number>()
  for (const item of schedule) {
    if (!item.triggerType) continue
    const key = `${item.triggerType}:${item.linkedMilestoneId ?? item.linkedDeliverableId ?? ''}`
    triggers.set(key, (triggers.get(key) ?? 0) + 1)
    if (item.triggerType === 'milestone' && !item.linkedMilestoneId) {
      issues.push({
        severity: 'warning',
        code: 'CASH_MILESTONE_LINK',
        message: `Payment "${item.title || 'item'}": link a milestone for milestone-based trigger.`,
        componentId: component.id,
        field: 'paymentSchedule',
      })
    }
    if (item.triggerType === 'deliverable' && !item.linkedDeliverableId) {
      issues.push({
        severity: 'warning',
        code: 'CASH_DELIVERABLE_LINK',
        message: `Payment "${item.title || 'item'}": link a deliverable for deliverable-based trigger.`,
        componentId: component.id,
        field: 'paymentSchedule',
      })
    }
  }
  for (const [key, count] of triggers) {
    if (count > 1) {
      issues.push({
        severity: 'warning',
        code: 'CASH_DUPLICATE_TRIGGER',
        message: `Duplicate payment trigger detected (${key}).`,
        componentId: component.id,
        field: 'paymentSchedule',
      })
    }
  }

  return issues
}

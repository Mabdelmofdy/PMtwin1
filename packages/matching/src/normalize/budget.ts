import type { NormalizedBudget } from '../types/opportunity.ts'
import type { OpportunityPost } from '../types/opportunity.ts'

export function extractBudget(opportunity: OpportunityPost): NormalizedBudget {
  const exchangeData = opportunity.exchangeData ?? {}
  const attributes = opportunity.attributes ?? {}
  let min: number | null = null
  let max: number | null = null
  let currency = String(exchangeData.currency ?? 'SAR').toUpperCase()

  const budgetRange = exchangeData.budgetRange
  if (budgetRange && typeof budgetRange === 'object') {
    const range = budgetRange as { min?: unknown; max?: unknown; currency?: string }
    min = range.min != null ? Number(range.min) : null
    max = range.max != null ? Number(range.max) : null
    if (range.currency) currency = String(range.currency).toUpperCase()
  }

  if (min == null && max == null && exchangeData.cashAmount != null) {
    const amount = Number(exchangeData.cashAmount)
    min = max = Number.isNaN(amount) ? null : amount
  }

  const salaryRange = attributes.salaryRange
  if (min == null && salaryRange && typeof salaryRange === 'object') {
    const range = salaryRange as { min?: unknown; max?: unknown; currency?: string }
    min = range.min != null ? Number(range.min) : null
    max = range.max != null ? Number(range.max) : null
    if (range.currency) currency = String(range.currency).toUpperCase()
  }

  if (min == null && attributes.targetPrice != null) {
    const amount = Number(attributes.targetPrice)
    min = max = Number.isNaN(amount) ? null : amount
  }

  if (min == null && attributes.price != null) {
    const amount = Number(attributes.price)
    min = max = Number.isNaN(amount) ? null : amount
  }

  return {
    min: min != null ? min : undefined,
    max: max != null ? max : undefined,
    currency,
  }
}

import { getNormalized } from '../value/value-compatibility.ts'
import type { OpportunityPost } from '../types/opportunity.ts'

export function estimateValueSar(opportunity: OpportunityPost): number | null {
  const exchangeData = opportunity.exchangeData ?? {}
  const attributes = opportunity.attributes ?? {}

  if (exchangeData.cashAmount != null) return Number(exchangeData.cashAmount)

  const budgetRange = exchangeData.budgetRange
  if (budgetRange && typeof budgetRange === 'object') {
    const range = budgetRange as { min?: unknown; max?: unknown }
    const min = Number(range.min)
    const max = Number(range.max)
    if (!Number.isNaN(min) && !Number.isNaN(max)) return (min + max) / 2
    if (!Number.isNaN(min)) return min
    if (!Number.isNaN(max)) return max
  }

  const salaryRange = attributes.salaryRange
  if (salaryRange && typeof salaryRange === 'object') {
    const range = salaryRange as { min?: unknown; max?: unknown }
    const min = Number(range.min)
    const max = Number(range.max)
    if (!Number.isNaN(min) && !Number.isNaN(max)) return (min + max) / 2
    if (!Number.isNaN(min)) return min
    if (!Number.isNaN(max)) return max
  }

  if (exchangeData.barterValue != null) return Number(exchangeData.barterValue)
  if (attributes.price != null) return Number(attributes.price)
  if (attributes.targetPrice != null) return Number(attributes.targetPrice)
  return null
}

export function valueEquivalenceText(
  opportunityA: OpportunityPost,
  opportunityB: OpportunityPost,
): string | undefined {
  const valueA = estimateValueSar(opportunityA)
  const valueB = estimateValueSar(opportunityB)
  if (valueA == null || valueB == null || valueB === 0) return undefined
  const ratio = valueA / valueB
  const titleB = opportunityB.title ?? 'units'
  return `~${ratio.toFixed(1)} × (${titleB})`
}

export function barterSidePost(
  needPost: OpportunityPost,
  offerPost: OpportunityPost,
): OpportunityPost {
  const needNorm = getNormalized(needPost)
  const offerNorm = getNormalized(offerPost)
  return {
    value_exchange: {
      _normalized: {
        totalOffered: offerNorm.totalOffered,
        totalExpected: needNorm.totalExpected,
        riskAdjustedOffered: offerNorm.riskAdjustedOffered,
        riskAdjustedExpected: needNorm.riskAdjustedExpected,
      },
    },
  }
}

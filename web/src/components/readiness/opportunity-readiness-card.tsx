import { useMemo } from 'react'
import { evaluateOpportunityReadiness } from '@/domain/opportunity-readiness/opportunity-readiness-evaluator.ts'
import type { OpportunityReadinessOpportunity } from '@/domain/opportunity-readiness/types.ts'
import { ReadinessCard } from '@/components/readiness/readiness-card.tsx'
import { resolveOpportunityReadinessCta } from '@/components/readiness/readiness-ui-rules.ts'

export function toOpportunityReadinessInput(
  opportunity?: object | null,
): OpportunityReadinessOpportunity | null {
  if (!opportunity) return null
  return opportunity as OpportunityReadinessOpportunity
}

export function resolveOpportunityReadiness(
  opportunity?: object | null,
) {
  return evaluateOpportunityReadiness(toOpportunityReadinessInput(opportunity))
}

export function OpportunityReadinessCard({
  opportunity,
  opportunityId,
  suppressCta = false,
  title = 'Opportunity Readiness',
  className,
}: {
  opportunity?: object | null
  opportunityId?: string
  suppressCta?: boolean
  title?: string
  className?: string
}) {
  const readinessInput = useMemo(
    () => toOpportunityReadinessInput(opportunity),
    [opportunity],
  )

  const result = useMemo(
    () => resolveOpportunityReadiness(readinessInput),
    [readinessInput],
  )

  const resolvedOpportunityId =
    opportunityId ??
    (readinessInput && 'id' in readinessInput
      ? (readinessInput.id as string | undefined)
      : undefined)

  const cta = useMemo(
    () =>
      resolveOpportunityReadinessCta(resolvedOpportunityId, result, {
        suppressCta,
      }),
    [resolvedOpportunityId, result, suppressCta],
  )

  return (
    <ReadinessCard title={title} result={result} className={className} cta={cta} />
  )
}

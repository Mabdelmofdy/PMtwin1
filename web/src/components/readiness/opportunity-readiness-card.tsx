import { useMemo } from 'react'
import {
  evaluateOpportunityReadinessCanonical,
} from '@/domain/opportunity-readiness/opportunity-readiness-evaluator.ts'
import { evaluateOpportunityReadiness } from '@/domain/opportunity-readiness/opportunity-readiness-evaluator.ts'
import type {
  OpportunityReadinessOpportunity,
  OpportunityReadinessResult,
} from '@/domain/opportunity-readiness/types.ts'
import type { ReadinessResult } from '@pm-twin/collaboration-models'
import { ReadinessCard } from '@/components/readiness/readiness-card.tsx'
import { resolveOpportunityReadinessCta } from '@/components/readiness/readiness-ui-rules.ts'
import { buildOpportunityExplanation } from '@/services/explainability/index.ts'

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

export function resolveOpportunityReadinessCanonical(
  opportunity?: object | null,
): ReadinessResult {
  return evaluateOpportunityReadinessCanonical(toOpportunityReadinessInput(opportunity))
}

export function OpportunityReadinessCard({
  opportunity,
  opportunityId,
  suppressCta = false,
  title = 'Opportunity Readiness',
  className,
  result: resultOverride,
}: {
  opportunity?: object | null
  opportunityId?: string
  suppressCta?: boolean
  title?: string
  className?: string
  /** Optional precomputed readiness (e.g. wizard progressive Completion Score). */
  result?: OpportunityReadinessResult
}) {
  const readinessInput = useMemo(
    () => toOpportunityReadinessInput(opportunity),
    [opportunity],
  )

  const canonical = useMemo(
    () => resolveOpportunityReadinessCanonical(readinessInput),
    [readinessInput],
  )

  const evaluated = useMemo(
    () => resolveOpportunityReadiness(readinessInput),
    [readinessInput],
  )
  const result = resultOverride ?? evaluated

  const resolvedOpportunityId =
    opportunityId ??
    (readinessInput && 'id' in readinessInput
      ? (readinessInput.id as string | undefined)
      : undefined) ??
    'draft-opportunity'

  const bundle = useMemo(
    () => buildOpportunityExplanation(resolvedOpportunityId, canonical, {
      subModelKey:
        typeof readinessInput?.subModelType === 'string'
          ? readinessInput.subModelType
          : undefined,
    }),
    [resolvedOpportunityId, canonical, readinessInput],
  )

  const cta = useMemo(
    () =>
      resolveOpportunityReadinessCta(resolvedOpportunityId, result, {
        suppressCta,
      }),
    [resolvedOpportunityId, result, suppressCta],
  )

  return (
    <ReadinessCard
      title={title}
      result={result}
      className={className}
      cta={cta}
      opportunityCopy
      bundle={bundle}
      scoreKindLabel="Opportunity Readiness"
    />
  )
}

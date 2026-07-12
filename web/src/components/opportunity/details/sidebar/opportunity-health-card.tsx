import { useOpportunityDetailsContext } from '../opportunity-details-context.tsx'
import { PmBadge } from '@/components/ui/pm-badge'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import type { OpportunityHealthState } from '@/components/opportunity/opportunity-health-indicator.tsx'

type HealthPresentation = {
  readonly label: 'Healthy' | 'Warnings' | 'Blocking Issues'
  readonly tone: 'success' | 'warning' | 'danger'
}

function resolveHealthPresentation(input: {
  readonly blockersCount: number
  readonly recommendationsCount: number
  readonly healthState: OpportunityHealthState
}): HealthPresentation | null {
  const { blockersCount, recommendationsCount, healthState } = input
  if (healthState === 'Archived' || healthState === 'Withdrawn') {
    return null
  }
  if (blockersCount > 0) {
    return { label: 'Blocking Issues', tone: 'danger' }
  }
  if (recommendationsCount > 0 || healthState === 'Needs Attention') {
    return { label: 'Warnings', tone: 'warning' }
  }
  if (
    healthState === 'Ready to Publish' ||
    healthState === 'Published' ||
    (blockersCount === 0 && recommendationsCount === 0)
  ) {
    return { label: 'Healthy', tone: 'success' }
  }
  return null
}

/**
 * Compact Opportunity Health — presentation only.
 * Reuses readiness + lifecycle health; hides when data is insufficient or not authorized.
 * Does not invent scores or estimated-match heuristics.
 */
export function OpportunityHealthCard() {
  const { model } = useOpportunityDetailsContext()
  const { capabilities, readiness, kpis } = model

  if (!capabilities.canViewReadinessDetails) return null

  const blockersCount = readiness.missingRequired.length
  const recommendationsCount = readiness.missingRecommended.length
  const presentation = resolveHealthPresentation({
    blockersCount,
    recommendationsCount,
    healthState: readiness.health,
  })

  if (!presentation) return null

  return (
    <section className="space-y-2" data-slot="opportunity-health-card">
      <h3 className={cn(pmTypography.label)}>Opportunity Health</h3>
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <PmBadge tone={presentation.tone} size="sm">
            {presentation.label}
          </PmBadge>
          <PmBadge tone="muted" size="sm">
            {readiness.health}
          </PmBadge>
        </div>
        <dl className="grid gap-1.5 sm:grid-cols-2">
          <div>
            <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>
              Blocking issues
            </dt>
            <dd className={cn(pmTypography.bodySm, 'tabular-nums')}>{blockersCount}</dd>
          </div>
          <div>
            <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>
              Recommendations
            </dt>
            <dd className={cn(pmTypography.bodySm, 'tabular-nums')}>{recommendationsCount}</dd>
          </div>
        </dl>
        {blockersCount > 0 ? (
          <ul className={cn(pmTypography.caption, 'list-inside list-disc text-muted-foreground')}>
            {readiness.missingRequired.slice(0, 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
          {kpis.readiness.healthLabel} · readiness {Math.round(readiness.score)}%
        </p>
      </div>
    </section>
  )
}

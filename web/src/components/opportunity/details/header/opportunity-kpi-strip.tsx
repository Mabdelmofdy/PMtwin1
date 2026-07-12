import type { OpportunityDetailsReadModel } from '@/lib/opportunity-details'
import { formatReadinessScorePercent } from '@/components/ui/pm-readiness-score-display'
import { OpportunityKpiCard } from './opportunity-kpi-card.tsx'

export function OpportunityKpiStrip({
  model,
}: {
  readonly model: OpportunityDetailsReadModel
}) {
  if (!model.workspaceVisibility.showKpiStrip) return null
  const { kpis } = model

  const readinessTone =
    kpis.readiness.blockersCount > 0 && model.collaboration.lifecycle === 'draft'
      ? 'warning'
      : 'success'

  return (
    <div
      data-slot="opportunity-kpi-strip"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
      aria-label="Opportunity KPIs"
    >
      <OpportunityKpiCard
        label="Readiness"
        value={formatReadinessScorePercent(kpis.readiness.score)}
        detail={`${kpis.readiness.blockersCount} required · ${kpis.readiness.recommendationsCount} recommended`}
        tone={readinessTone}
      />
      <OpportunityKpiCard
        label="Lifecycle"
        value={String(kpis.lifecycle.primaryLabel)}
        detail={kpis.lifecycle.nextMeaningfulState}
      />
      <OpportunityKpiCard
        label="Matching"
        value={
          kpis.matching.available
            ? `${kpis.matching.count ?? 0}`
            : '—'
        }
        detail={
          kpis.matching.available
            ? `${kpis.matching.strongCount ?? 0} strong`
            : 'Not available'
        }
        tone={kpis.matching.available ? 'default' : 'muted'}
      />
      <OpportunityKpiCard
        label="Scope"
        value={`${kpis.scope.workPackageCount} WP`}
        detail={`${kpis.scope.taskCount} tasks · ${kpis.scope.deliverableCount} del · ${kpis.scope.milestoneCount} ms`}
      />
      <OpportunityKpiCard
        label="Commercial"
        value={kpis.commercial.structureLabel ?? '—'}
        detail={
          kpis.commercial.componentCount > 0
            ? `${kpis.commercial.componentCount} components${kpis.commercial.allocationMethod ? ` · ${kpis.commercial.allocationMethod}` : ''}`
            : 'No structure'
        }
        tone={kpis.commercial.structureLabel ? 'default' : 'muted'}
      />
      <OpportunityKpiCard
        label="Timeline"
        value={kpis.timeline.state}
        detail={[kpis.timeline.startDate, kpis.timeline.deadline].filter(Boolean).join(' → ') || kpis.timeline.duration}
      />
    </div>
  )
}

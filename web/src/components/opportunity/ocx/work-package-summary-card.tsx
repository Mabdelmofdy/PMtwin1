import { OcxSummaryCard } from '@/components/opportunity/ocx/ocx-summary-card.tsx'
import type { StructuredSkill } from '@/domain/opportunity-creation'
import type { WorkPackageInput } from '@pm-twin/validation'

export type WorkPackageSummaryCardProps = {
  readonly workPackages?: readonly WorkPackageInput[]
  readonly skills?: readonly StructuredSkill[]
  readonly resourcesCount?: number
  readonly deliverablesCount?: number
  readonly estimatedDurationDays?: number | null
  readonly state?: 'loading' | 'empty' | 'normal' | 'error'
}

/**
 * Compact work-package / skills / resources summary for Review and Detail.
 */
export function WorkPackageSummaryCard({
  workPackages = [],
  skills = [],
  resourcesCount = 0,
  deliverablesCount = 0,
  estimatedDurationDays = null,
  state,
}: WorkPackageSummaryCardProps) {
  const hasAny =
    workPackages.length > 0 ||
    skills.length > 0 ||
    resourcesCount > 0 ||
    deliverablesCount > 0

  return (
    <OcxSummaryCard
      title="Work packages & capacity"
      why="Clear packages and skills help partners estimate fit before they apply."
      state={state ?? (hasAny ? 'normal' : 'empty')}
      emptyTitle="No packages yet"
      emptyDescription="Add work packages and structured skills in the Attributes step."
      testId="work-package-summary-card"
    >
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Work packages</dt>
          <dd className="text-lg font-semibold tabular-nums">{workPackages.length}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Required skills</dt>
          <dd className="text-lg font-semibold tabular-nums">
            {skills.length}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Resources</dt>
          <dd className="text-lg font-semibold tabular-nums">{resourcesCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Deliverables</dt>
          <dd className="text-lg font-semibold tabular-nums">{deliverablesCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Estimated duration</dt>
          <dd className="text-lg font-semibold tabular-nums">
            {estimatedDurationDays != null ? `${estimatedDurationDays} days` : '—'}
          </dd>
        </div>
      </dl>
    </OcxSummaryCard>
  )
}

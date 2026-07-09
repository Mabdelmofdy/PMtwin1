import type { ExplanationBundle } from '@pm-twin/explainability'
import { cn } from '@/lib/utils'
import { ExplanationBlockers } from '@/components/explainability/explanation-blockers.tsx'
import { ExplanationBreakdown } from '@/components/explainability/explanation-breakdown.tsx'
import { ExplanationRecommendations } from '@/components/explainability/explanation-recommendations.tsx'
import { ExplanationSummary } from '@/components/explainability/explanation-summary.tsx'
import { ExplanationTimeline } from '@/components/explainability/explanation-timeline.tsx'

export type ExplanationPanelProps = {
  bundle: ExplanationBundle
  className?: string
  scoreLabel?: string
  compact?: boolean
  showBreakdown?: boolean
  showTimeline?: boolean
  showBlockers?: boolean
  showRecommendations?: boolean
}

/** Composes ExplanationBundle sections into a single inspector panel. */
export function ExplanationPanel({
  bundle,
  className,
  scoreLabel,
  compact = false,
  showBreakdown = true,
  showTimeline = !compact,
  showBlockers = true,
  showRecommendations = true,
}: ExplanationPanelProps) {
  return (
    <div
      className={cn('space-y-4', className)}
      data-slot="explanation-panel"
      data-engine={bundle.engine}
    >
      <ExplanationSummary bundle={bundle} scoreLabel={scoreLabel} />
      {showBlockers ? <ExplanationBlockers bundle={bundle} /> : null}
      {showRecommendations ? (
        <ExplanationRecommendations bundle={bundle} compact={compact} />
      ) : null}
      {showBreakdown ? <ExplanationBreakdown bundle={bundle} /> : null}
      {showTimeline ? <ExplanationTimeline bundle={bundle} /> : null}
    </div>
  )
}

import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  buildReadinessCardViewModel,
  getReadinessStatusTone,
  type ReadinessResult,
} from '@/components/readiness/readiness-display.ts'
import type { ReadinessCta } from '@/components/readiness/readiness-ui-rules.ts'
import { ReadinessList } from '@/components/readiness/readiness-list.tsx'
import { ReadinessScoreRing } from '@/components/readiness/readiness-score-ring.tsx'
import { ReadinessStatusBadge } from '@/components/readiness/readiness-status-badge.tsx'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmButton } from '@/components/ui/pm-button'
import { pmTypography } from '@/components/shared/pm-design-tokens'

const toneBorderStyles: Record<ReturnType<typeof getReadinessStatusTone>, string> = {
  incomplete: 'border-warning/30',
  needs_review: 'border-info/30',
  ready: 'border-success/30',
}

export function ReadinessCard({
  title,
  result,
  className,
  cta,
  opportunityCopy = false,
}: {
  title: string
  result: ReadinessResult
  className?: string
  cta?: ReadinessCta | null
  /** Use Opportunity Readiness / Ready to publish wording (not Match Score). */
  opportunityCopy?: boolean
}) {
  const viewModel = buildReadinessCardViewModel(title, result, { opportunityCopy })
  const tone = getReadinessStatusTone(result.status)

  return (
    <PmContentCard
      title={viewModel.title}
      className={cn('border-border/60', toneBorderStyles[tone], className)}
      actions={<ReadinessStatusBadge status={result.status} />}
    >
      <div className="flex items-center gap-4">
        <ReadinessScoreRing score={result.score} status={result.status} />
        <div className={cn('space-y-1', pmTypography.bodySm)}>
          <p className="text-muted-foreground">Opportunity Readiness</p>
          <p className={pmTypography.stat}>{viewModel.scoreLabel}</p>
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
            Completion Score
          </p>
          <p>
            <span className="text-muted-foreground">Status:</span>{' '}
            <span className="font-medium">{viewModel.statusLabel}</span>
          </p>
        </div>
      </div>

      <ReadinessList
        missingRequired={viewModel.missingRequired}
        missingRecommended={viewModel.missingRecommended}
        showReadyMessage={viewModel.showReadyMessage}
      />

      {cta ? (
        <PmButton variant="outline" className="w-full" asChild>
          <Link to={cta.href}>{cta.label}</Link>
        </PmButton>
      ) : null}
    </PmContentCard>
  )
}

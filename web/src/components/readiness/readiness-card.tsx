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
import {
  PmCard,
  PmCardContent,
  PmCardHeader,
  PmCardTitle,
} from '@/components/ui/pm-card'
import { PmButton } from '@/components/ui/pm-button'

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
}: {
  title: string
  result: ReadinessResult
  className?: string
  cta?: ReadinessCta | null
}) {
  const viewModel = buildReadinessCardViewModel(title, result)
  const tone = getReadinessStatusTone(result.status)

  return (
    <PmCard
      composed
      className={cn('border-border/60', toneBorderStyles[tone], className)}
    >
      <PmCardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <PmCardTitle className="text-base">{viewModel.title}</PmCardTitle>
          <ReadinessStatusBadge status={result.status} />
        </div>
      </PmCardHeader>
      <PmCardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <ReadinessScoreRing score={result.score} status={result.status} />
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">Score</p>
            <p className="text-2xl font-semibold tracking-tight">{viewModel.scoreLabel}</p>
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
      </PmCardContent>
    </PmCard>
  )
}

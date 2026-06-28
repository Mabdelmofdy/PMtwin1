import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

const toneBorderStyles: Record<ReturnType<typeof getReadinessStatusTone>, string> = {
  incomplete: 'border-amber-500/30',
  needs_review: 'border-sky-500/30',
  ready: 'border-emerald-500/30',
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
    <Card className={cn('border-border/60', toneBorderStyles[tone], className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{viewModel.title}</CardTitle>
          <ReadinessStatusBadge status={result.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <Button variant="outline" className="w-full cursor-pointer" asChild>
            <Link to={cta.href}>{cta.label}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

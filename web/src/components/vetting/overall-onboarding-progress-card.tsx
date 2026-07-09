import type { OverallOnboardingProgress } from '@/domain/pending-vetting-journey/types.ts'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { ReadinessScoreRing } from '@/components/readiness/readiness-score-ring.tsx'
import { pmTypography } from '@/tokens'
import { cn } from '@/lib/utils'

export function OverallOnboardingProgressCard({
  overall,
  stepsRemaining,
  currentStageIndex,
  totalStages,
}: {
  readonly overall: OverallOnboardingProgress
  readonly stepsRemaining: number
  readonly currentStageIndex: number
  readonly totalStages: number
}) {
  return (
    <PmContentCard title="Overall onboarding">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <ReadinessScoreRing score={overall.percent} status="needs_review" />
        <div className="space-y-2">
          <p className={cn(pmTypography.stat, 'text-2xl')}>{overall.percent}%</p>
          <p className={pmTypography.bodySm}>
            <span className="text-muted-foreground">Stage</span>{' '}
            <span className="font-medium">
              {currentStageIndex} / {totalStages}
            </span>
          </p>
          <p className={pmTypography.bodySm}>
            <span className="font-medium">{stepsRemaining}</span>{' '}
            <span className="text-muted-foreground">
              {stepsRemaining === 1 ? 'Step Remaining' : 'Steps Remaining'}
            </span>
          </p>
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
            Profile {Math.round(overall.profileWeight * 100)}% · Vetting{' '}
            {Math.round(overall.vettingWeight * 100)}% · Admin approval{' '}
            {Math.round(overall.adminApprovalWeight * 100)}%
          </p>
        </div>
      </div>
    </PmContentCard>
  )
}

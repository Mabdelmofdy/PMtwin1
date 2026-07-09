import type { OverallOnboardingProgress } from '@/domain/pending-vetting-journey/types.ts'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { ReadinessScoreRing } from '@/components/readiness/readiness-score-ring.tsx'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'

export function OverallOnboardingProgressCard({
  overall,
  stepsRemaining,
  nextBestAction,
}: {
  readonly overall: OverallOnboardingProgress
  readonly stepsRemaining: number
  readonly nextBestAction: string
}) {
  return (
    <PmContentCard title="Overall onboarding">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <ReadinessScoreRing score={overall.percent} status="needs_review" />
        <div className="space-y-2">
          <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
            UI-only progress — not used for permissions or business logic.
          </p>
          <p className={cn(pmTypography.stat, 'text-2xl')}>{overall.percent}% complete</p>
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
            Profile {Math.round(overall.profileWeight * 100)}% · Vetting{' '}
            {Math.round(overall.vettingWeight * 100)}% · Admin approval{' '}
            {Math.round(overall.adminApprovalWeight * 100)}%
          </p>
          <p className={pmTypography.bodySm}>
            <span className="text-muted-foreground">Steps remaining:</span> {stepsRemaining}
          </p>
          <p className={pmTypography.bodySm}>
            <span className="text-muted-foreground">Next best action:</span>{' '}
            <span className="font-medium">{nextBestAction}</span>
          </p>
        </div>
      </div>
    </PmContentCard>
  )
}

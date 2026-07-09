import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { PlatformUser } from '@/types/domain.ts'
import { evaluateVettingReadiness } from '@/domain/vetting-readiness/vetting-readiness-evaluator.ts'
import { resolvePendingVettingJourney } from '@/domain/pending-vetting-journey/pending-vetting-journey.ts'
import { PmBadge, PmButton, PmPageHeader, PmPageHeroMetric, PmStatsStrip } from '@/components/ui/pm-index'
import { PmContentCard, PmDashboardLayout } from '@/components/layout/pm-layout-index'
import { formatReadinessScorePercent } from '@/components/ui/pm-readiness-score-display'
import {
  resolveProfileCompletionScore,
  resolveScorableProfileForUser,
} from '@/lib/scorable-profile-service.ts'
import { partiesApi } from '@/api/parties.ts'
import { partyDocumentRepository } from '@/repositories/index.ts'
import { vettingService } from '@/lib/vetting-service.ts'
import { PendingVettingJourneyPanel } from '@/components/vetting/pending-vetting-journey-panel.tsx'
import { OverallOnboardingProgressCard } from '@/components/vetting/overall-onboarding-progress-card.tsx'
import { VettingDocumentsProgressCard } from '@/components/vetting/vetting-documents-progress-card.tsx'
import { PendingVettingSecondaryActions } from '@/components/vetting/pending-vetting-secondary-actions.tsx'
import { PendingVettingWhatHappensNext } from '@/components/vetting/pending-vetting-what-happens-next.tsx'
import { resolveVettingActionQueue } from '@/components/vetting/resolve-vetting-action-queue.ts'
import { ExplanationPanel } from '@/components/explainability/explanation-panel.tsx'
import {
  buildProfileExplanation,
  buildVettingExplanation,
  getAggregatedRecommendations,
} from '@/services/explainability/index.ts'
import { ExplanationRecommendations } from '@/components/explainability/explanation-recommendations.tsx'
import { pmTypography } from '@/tokens'
import { cn } from '@/lib/utils'
import { useDataStoreVersion } from '@/hooks/use-data-store'

function toTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function resolveCurrentStageIndex(
  steps: ReturnType<typeof resolvePendingVettingJourney>['steps'],
): number {
  const activeIndex = steps.findIndex(
    (step) => step.state === 'current' || step.state === 'blocked',
  )
  if (activeIndex >= 0) return activeIndex + 1
  return steps.filter((step) => step.state === 'completed').length
}

export function PendingVettingDashboard({ user }: { user: PlatformUser }) {
  useDataStoreVersion()
  const profileCompletion = resolveProfileCompletionScore(user)
  const { profile: scorableProfile } = resolveScorableProfileForUser(user)
  const profileCompletionUnlocked = scorableProfile.profileCompletionUnlocked === true
  const activePartyId = partiesApi.resolveActivePartyId(user.id)
  const vettingDocuments = partyDocumentRepository
    .listForParty(activePartyId)
    .filter((document) => document.documentCategory === 'vetting')

  const vetting = evaluateVettingReadiness({
    accountStatus: user.status,
    reviewProgress: user.profile?.vetting?.reviewProgress,
    changesResolved: user.profile?.vetting?.changesResolved,
    documents: vettingDocuments,
  })

  const profileBundle = buildProfileExplanation(
    user.id,
    user.role === 'company' ? 'company' : 'individual',
    profileCompletion,
    scorableProfile,
  )
  const vettingBundle = buildVettingExplanation(user.id, vetting, {
    accountStatus: user.status,
    reviewProgress: user.profile?.vetting?.reviewProgress,
    changesResolved: user.profile?.vetting?.changesResolved,
    documents: vettingDocuments,
  })
  const onboardingRecommendations = getAggregatedRecommendations(
    [profileBundle, vettingBundle],
    5,
  )

  const journey = resolvePendingVettingJourney({
    user,
    profile: profileCompletion,
    profileCompletionUnlocked,
    vetting,
    documents: vettingDocuments,
  })

  const actionQueue = resolveVettingActionQueue({
    user,
    journey,
    profile: profileCompletion,
    vetting,
  })

  const changesRequested =
    user.profile?.vetting?.reviewProgress === 'changes_requested'
    || user.status === 'clarification_requested'
  const requestedItems =
    user.profile?.vetting?.requestedChanges ??
    user.profile?.vetting?.requestedItems ??
    []

  const totalStages = journey.steps.length
  const currentStageIndex = resolveCurrentStageIndex(journey.steps)

  return (
    <PmDashboardLayout
      header={
        <PmPageHeader
          label="Dashboard"
          title="Pending Vetting"
          description="Complete profile and verification actions to unlock full workspace actions."
          tone="mission"
          metric={
            <PmPageHeroMetric
              value={formatReadinessScorePercent(journey.overallOnboarding.percent)}
              label="Overall onboarding"
              animate={false}
            />
          }
          badges={<PmBadge tone="warning">Pending Vetting</PmBadge>}
          actions={
            <div className="flex flex-wrap gap-2">
              <PmButton asChild variant="outline">
                <Link to="/party-documents">Upload documents</Link>
              </PmButton>
              <PmButton asChild>
                <Link to="/profile">Complete profile</Link>
              </PmButton>
              {changesRequested ? (
                <PmButton
                  onClick={() => {
                    vettingService.resubmitForReview(user.id, activePartyId)
                    toast.success('Resubmitted for vetting review')
                  }}
                >
                  Resubmit for review
                </PmButton>
              ) : null}
            </div>
          }
        />
      }
      metrics={
        <PmStatsStrip
          items={[
            { label: 'Account status', value: toTitleCase(user.status.replace(/_/g, ' ')) },
            { label: 'Profile completion', value: formatReadinessScorePercent(profileCompletion.score) },
            { label: 'Vetting progress', value: formatReadinessScorePercent(vetting.score) },
            {
              label: 'Stage',
              value: `${currentStageIndex} / ${totalStages}`,
            },
          ]}
        />
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <OverallOnboardingProgressCard
            overall={journey.overallOnboarding}
            stepsRemaining={journey.stepsRemaining}
            currentStageIndex={currentStageIndex}
            totalStages={totalStages}
          />
          <VettingDocumentsProgressCard documents={vettingDocuments} />
        </div>

        <PendingVettingJourneyPanel steps={journey.steps} actionQueue={actionQueue} />

        {onboardingRecommendations.length > 0 ? (
          <PmContentCard title="Next best actions">
            <ExplanationRecommendations
              bundle={{
                ...profileBundle,
                recommendations: onboardingRecommendations,
              }}
              heading="Prioritized onboarding actions"
            />
          </PmContentCard>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <PmContentCard title="Profile gaps">
            <ExplanationPanel
              bundle={profileBundle}
              compact
              showBreakdown={false}
              showTimeline={false}
            />
          </PmContentCard>
          <PmContentCard title="Vetting gaps">
            <ExplanationPanel
              bundle={vettingBundle}
              compact
              showBreakdown={false}
              showTimeline={false}
            />
          </PmContentCard>
        </div>

        {changesRequested ? (
          <PmContentCard title="Changes requested" id="vetting-review" role="status">
            <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
              {user.profile?.vetting?.reviewNotes ?? user.profile?.vetting?.reason}
            </p>
            {requestedItems.length > 0 ? (
              <ul className={cn('mt-2 list-disc ps-5', pmTypography.bodySm)}>
                {requestedItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {user.profile?.vetting?.dueDate ? (
              <p className={cn('mt-2', pmTypography.caption, 'text-muted-foreground')}>
                Due by {user.profile.vetting.dueDate}
              </p>
            ) : null}
          </PmContentCard>
        ) : null}

        <PendingVettingSecondaryActions actionQueue={actionQueue} />
        <PendingVettingWhatHappensNext />
      </div>
    </PmDashboardLayout>
  )
}

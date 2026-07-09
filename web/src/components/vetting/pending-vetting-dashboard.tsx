import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { PlatformUser } from '@/types/domain.ts'
import { evaluateVettingReadiness } from '@/domain/vetting-readiness/vetting-readiness-evaluator.ts'
import { resolvePendingVettingJourney } from '@/domain/pending-vetting-journey/pending-vetting-journey.ts'
import { PmActionHub, PmBadge, PmButton, PmPageHeader, PmStatsStrip } from '@/components/ui/pm-index'
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
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'
import { useDataStoreVersion } from '@/hooks/use-data-store'

function toTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function resolveActionLink(action: string): { readonly label: string; readonly href: string } {
  const normalized = action.toLowerCase()
  if (normalized.includes('resubmit')) {
    return { label: 'Resubmit for review', href: '/party-documents' }
  }
  if (
    normalized.includes('upload')
    || normalized.includes('replace expired')
    || normalized.includes('document')
    || normalized.includes('vat')
    || normalized.includes('cr')
  ) {
    return { label: 'Upload documents', href: '/party-documents' }
  }
  if (normalized.includes('waiting for admin review')) {
    return { label: 'View status', href: '/dashboard' }
  }
  return { label: 'Open profile', href: '/profile' }
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

  const journey = resolvePendingVettingJourney({
    user,
    profile: profileCompletion,
    profileCompletionUnlocked,
    vetting,
    documents: vettingDocuments,
  })

  const changesRequested = user.profile?.vetting?.reviewProgress === 'changes_requested'
  const requestedItems =
    user.profile?.vetting?.requestedChanges ??
    user.profile?.vetting?.requestedItems ??
    []

  const pendingActions = [journey.nextBestAction]

  return (
    <PmDashboardLayout
      header={
        <PmPageHeader
          label="Dashboard"
          title="Pending Vetting"
          description="Complete profile and verification actions to unlock full workspace actions."
          tone="mission"
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
              label: 'Documents progress',
              value: `${vetting.documentsProgress.approvedRequired} / ${vetting.documentsProgress.totalRequired}`,
            },
          ]}
        />
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <OverallOnboardingProgressCard
          overall={journey.overallOnboarding}
          stepsRemaining={journey.stepsRemaining}
          nextBestAction={journey.nextBestAction}
        />
        <PendingVettingJourneyPanel steps={journey.steps} />
      </div>

      {changesRequested ? (
        <PmContentCard title="Changes requested" className="mt-4">
          <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
            {user.profile?.vetting?.reviewNotes ?? user.profile?.vetting?.reason}
          </p>
          {requestedItems.length > 0 ? (
            <ul className={cn('mt-2 list-disc pl-5', pmTypography.bodySm)}>
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

      <PmActionHub
        className="mt-4"
        title="Next actions"
        description="Explainable recommendations derived from readiness evaluators."
        items={pendingActions.map((action, index) => ({
          id: `pending-action-${index}`,
          title: action,
          context: 'Complete and resubmit to move vetting forward.',
          primary: resolveActionLink(action),
        }))}
      />
    </PmDashboardLayout>
  )
}

import { Link } from 'react-router-dom'
import type { PlatformUser } from '@/types/domain.ts'
import { evaluateVettingReadiness } from '@/domain/vetting-readiness/vetting-readiness-evaluator.ts'
import { PmActionHub, PmBadge, PmButton, PmPageHeader, PmStatsStrip } from '@/components/ui/pm-index'
import { PmDashboardLayout } from '@/components/layout/pm-layout-index'
import { formatReadinessScorePercent } from '@/components/ui/pm-readiness-score-display'
import { resolveProfileCompletionScore } from '@/lib/scorable-profile-service.ts'
import { partiesApi } from '@/api/parties.ts'
import { partyDocumentRepository } from '@/repositories/index.ts'

function toTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function PendingVettingDashboard({ user }: { user: PlatformUser }) {
  const profileCompletion = resolveProfileCompletionScore(user)
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

  const pendingActions = vetting.recommendations.length > 0
    ? vetting.recommendations
    : ['Waiting for Admin Review']

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
            <PmButton asChild>
              <Link to="/profile">Complete profile</Link>
            </PmButton>
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
      <PmActionHub
        title="Next actions"
        description="Explainable recommendations derived from readiness evaluators."
        items={pendingActions.map((action, index) => ({
          id: `pending-action-${index}`,
          title: action,
          context: 'Complete and resubmit to move vetting forward.',
          primary: { label: 'Open profile', href: '/profile' },
        }))}
      />
    </PmDashboardLayout>
  )
}


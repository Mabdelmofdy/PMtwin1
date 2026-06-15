import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  canUserApplyToOpportunity,
  filterApplicationsForOpportunity,
  resolveUserApplication,
  sortApplicationsByValueScore,
} from '@/lib/applications'
import { dataStore } from '@/lib/data-store'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useAuth } from '@/providers/auth-provider'
import { ApplicationsPanel } from '@/components/opportunity/applications-panel'
import { ApplyWizard } from '@/components/opportunity/apply-wizard'
import { PageHeader, StatusBadge } from '@/components/shared/page-primitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/format'

export function OpportunityDetailPage() {
  const version = useDataStoreVersion()
  const { id } = useParams()
  const { user, isPendingApproval } = useAuth()
  const [showWizard, setShowWizard] = useState(false)

  const opp = id ? dataStore.getOpportunityById(id) : undefined
  const applications = useMemo(() => dataStore.getApplications(), [version])

  if (!opp) {
    return <p className="text-muted-foreground">Opportunity not found.</p>
  }

  const isOwner = user?.id === opp.creatorId
  const { application, canEdit, canReapply } = user
    ? resolveUserApplication(applications, opp.id, user.id)
    : { application: undefined, canEdit: false, canReapply: false }

  const canApply = user
    ? canUserApplyToOpportunity(opp, user, {
        application,
        canReapply,
        hasDeal: !!application?.dealId,
      })
    : false

  const oppApplications = sortApplicationsByValueScore(
    filterApplicationsForOpportunity(applications, opp.id),
  ).map((app) => ({
    ...app,
    applicant: dataStore.getPersonById(app.applicantId),
  }))

  const opportunityClosed = [
    'contracted',
    'in_execution',
    'completed',
    'closed',
    'cancelled',
  ].includes(opp.status)

  const skills = opp.scope?.coreSkills ?? opp.attributes?.coreSkills ?? []
  const creator = opp.creatorId ? dataStore.getPersonById(opp.creatorId) : undefined

  return (
    <div className="space-y-6">
      <PageHeader
        label={opp.intent === 'offer' ? 'Offer' : 'Need'}
        title={opp.title}
        description={[opp.location, creator?.profile?.name].filter(Boolean).join(' · ')}
        actions={
          <>
            <StatusBadge status={opp.status} />
            {isOwner ? (
              <Button variant="outline" className="cursor-pointer" asChild>
                <Link to={`/opportunities/${opp.id}/edit`}>Edit</Link>
              </Button>
            ) : null}
          </>
        }
      />

      {isPendingApproval ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Your account is pending approval. You can browse but cannot apply or move pipeline cards yet.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {opp.description}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Core skills</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {skills.map((s: string) => (
                <span key={s} className="rounded-md bg-muted px-2 py-1 text-xs">{s}</span>
              ))}
            </CardContent>
          </Card>

          {isOwner ? (
            <ApplicationsPanel
              applications={oppApplications}
              canManage={!isPendingApproval}
              opportunityClosed={opportunityClosed}
            />
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Exchange</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Mode:</span> {opp.exchangeMode}</p>
              <p><span className="text-muted-foreground">Model:</span> {opp.modelType}</p>
              <p><span className="text-muted-foreground">Updated:</span> {formatDate(opp.updatedAt)}</p>
            </CardContent>
          </Card>

          {!isOwner && application && !canApply ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {application.status === 'accepted'
                    ? 'Application accepted'
                    : "You've applied"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <StatusBadge status={application.status} />
                <p className="text-muted-foreground">
                  Submitted {formatDate(application.createdAt)}
                </p>
                {canEdit && !isPendingApproval ? (
                  <Button
                    className="cursor-pointer"
                    variant="outline"
                    onClick={() => setShowWizard(true)}
                  >
                    Edit application
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {!isOwner && canApply && !isPendingApproval ? (
            showWizard ? (
              <ApplyWizard
                opportunityId={opp.id}
                applicantId={user!.id}
                onSubmitted={() => setShowWizard(false)}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <Button
                    className="w-full cursor-pointer"
                    onClick={() => setShowWizard(true)}
                  >
                    {canReapply ? 'Re-apply' : 'Apply now'}
                  </Button>
                </CardContent>
              </Card>
            )
          ) : null}
        </div>
      </div>
    </div>
  )
}

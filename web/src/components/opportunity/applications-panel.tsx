import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { Application } from '@/types/domain.ts'
import {
  APPLICATION_STATUS_LABELS,
  TRANSITIONABLE_APPLICATION_STATUSES,
} from '@/lib/applications'
import { matchingService } from '@/services/matching-service.ts'
import { negotiationService } from '@/services/negotiation-service.ts'
import { formatDate } from '@/lib/format'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge, PmButton, PmWorkflowBadge } from '@/components/ui/pm-index'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type ApplicationWithApplicant = Application & {
  applicant?: { profile?: { name?: string }; email?: string }
}

export const APPLICATIONS_LEGACY_SECTION_TITLE =
  'Direct applications (legacy / hiring)'

export const APPLICATIONS_LEGACY_EMPTY_MESSAGE =
  'No direct applications. Collaboration runs through PostMatches — review matches above to accept, negotiate, and create deals.'

export function ApplicationsPanel({
  applications,
  canManage,
  opportunityClosed,
  variant = 'legacy',
}: {
  applications: ApplicationWithApplicant[]
  canManage: boolean
  opportunityClosed: boolean
  variant?: 'legacy' | 'default'
}) {
  const handleStatusChange = (appId: string, status: string) => {
    negotiationService.transitionApplicationStatus(appId, status)
    toast.success('Application status updated')
  }

  const handleReject = (appId: string) => {
    negotiationService.rejectApplication(appId)
    toast.success('Application rejected')
  }

  const handleAccept = (appId: string) => {
    negotiationService.acceptApplication(appId)
    toast.success('Application accepted')
  }

  const sectionTitle =
    variant === 'legacy'
      ? APPLICATIONS_LEGACY_SECTION_TITLE
      : `Applications (${applications.length})`

  if (applications.length === 0) {
    return (
      <PmContentCard
        title={sectionTitle}
        className="border-border/50 bg-surface-muted/40"
      >
        <p className="text-sm text-muted-foreground">
          {variant === 'legacy'
            ? APPLICATIONS_LEGACY_EMPTY_MESSAGE
            : 'No applications yet. Published opportunities will receive applicant proposals here.'}
        </p>
      </PmContentCard>
    )
  }

  return (
    <PmContentCard
      title={
        variant === 'legacy'
          ? `${APPLICATIONS_LEGACY_SECTION_TITLE} (${applications.length})`
          : sectionTitle
      }
      description={
        variant === 'legacy'
          ? 'Optional hiring path — does not replace PostMatch → Negotiation → Deal.'
          : undefined
      }
      className="border-border/50 bg-surface-muted/40"
    >
      <div className="space-y-4">
        {applications.map((app) => {
          const av = matchingService.normalizeApplicationValue(app.application_value)
          const amount = matchingService.formatApplicationValueAmount(app.application_value)
          const actionable =
            canManage &&
            !opportunityClosed &&
            TRANSITIONABLE_APPLICATION_STATUSES.includes(app.status)

          return (
            <article
              key={app.id}
              className="rounded-xl border border-border/60 p-4 transition-colors hover:bg-surface-muted/50"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">
                  {app.applicant?.profile?.name ?? app.applicant?.email ?? 'Unknown applicant'}
                </p>
                <PmWorkflowBadge status={app.status} entity="application" />
                {av.valueScorePct != null ? (
                  <PmBadge tone="primary" size="sm">
                    Value {av.valueScorePct}%
                  </PmBadge>
                ) : null}
                {amount ? (
                  <span className="text-xs text-muted-foreground">{amount}</span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {app.proposal || app.coverLetter || 'No proposal provided.'}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Applied {formatDate(app.createdAt)}
              </p>
              {canManage ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <PmButton size="sm" variant="outline" asChild>
                    <Link to={`/people/${app.applicantId}`}>View profile</Link>
                  </PmButton>
                  {actionable ? (
                    <>
                      <Select
                        value={app.status}
                        onValueChange={(v) => handleStatusChange(app.id, v)}
                      >
                        <SelectTrigger className="h-8 w-40 cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRANSITIONABLE_APPLICATION_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="cursor-pointer">
                              {APPLICATION_STATUS_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <PmButton size="sm" onClick={() => handleAccept(app.id)}>
                        Accept
                      </PmButton>
                      <PmButton
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(app.id)}
                      >
                        Reject
                      </PmButton>
                    </>
                  ) : null}
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </PmContentCard>
  )
}

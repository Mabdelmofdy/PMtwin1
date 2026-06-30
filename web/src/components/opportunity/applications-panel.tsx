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
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge, PmButton, PmSurface, PmWorkflowBadge } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { productFlags } from '@/config/product-flags.ts'
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
  if (!productFlags.showLegacyApplications) {
    return null
  }

  const handleStatusChange = (appId: string, status: string) => {
    negotiationService.transitionApplicationStatus(appId, status)
    toast.success('Legacy application status updated')
  }

  const handleReject = (appId: string) => {
    negotiationService.rejectApplication(appId)
    toast.success('Legacy application rejected')
  }

  const handleAccept = (appId: string) => {
    negotiationService.acceptApplication(appId)
    toast.success('Legacy application accepted')
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
        <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
          {variant === 'legacy'
            ? APPLICATIONS_LEGACY_EMPTY_MESSAGE
            : 'No direct applications. PostMatch is the primary collaboration path.'}
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
            <PmSurface
              key={app.id}
              variant="default"
              shadow="card"
              className="p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className={cn(pmTypography.body, 'font-medium')}>
                  {app.applicant?.profile?.name ?? app.applicant?.email ?? 'Unknown profile'}
                </p>
                <PmWorkflowBadge status={app.status} entity="application" />
                {av.valueScorePct != null ? (
                  <PmBadge tone="primary" size="sm">
                    Value {av.valueScorePct}%
                  </PmBadge>
                ) : null}
                {amount ? (
                  <span className={cn(pmTypography.caption, 'text-muted-foreground')}>{amount}</span>
                ) : null}
              </div>
              <p className={cn(pmTypography.bodySm, 'mt-2 text-muted-foreground')}>
                {app.proposal || app.coverLetter || 'No proposal provided.'}
              </p>
              <p className={cn(pmTypography.caption, 'mt-2 text-muted-foreground')}>
                Submitted (legacy) {formatDate(app.createdAt)}
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
            </PmSurface>
          )
        })}
      </div>
    </PmContentCard>
  )
}

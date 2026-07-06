import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { Application } from '@/types/domain.ts'
import {
  APPLICATION_STATUS_LABELS,
  TRANSITIONABLE_APPLICATION_STATUSES,
} from '@/lib/applications'
import {
  canShowCreateHiringDeal,
  canShowStartHiringNegotiation,
  createHiringDealFromApplicationUiAction,
  resolveApplicationHiringDealLink,
  resolveApplicationHiringNegotiationLink,
  startHiringNegotiationFromApplicationUiAction,
} from '@/lib/application-hiring-ui-actions.ts'
import {
  buildWorkflowContext,
  findWorkflowAction,
} from '@/domain/workflows/workflow-bridge.ts'
import { matchingService } from '@/services/matching-service.ts'
import { negotiationService } from '@/services/negotiation-service.ts'
import { formatDate } from '@/lib/format'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge, PmButton, PmEmptyState, PmSurface, PmWorkflowBadge } from '@/components/ui/pm-index'
import { PmCardActions } from '@/components/ui/pm-more-actions'
import { cn } from '@/lib/utils'
import { productFlags } from '@/config/product-flags.ts'
import { PRODUCT_LANGUAGE } from '@/lib/product-language'
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
  'No direct applications. Collaboration runs through matches — review matches above to accept, negotiate, and create deals.'

function ApplicationHiringWorkflowActions({
  application,
  disabled,
}: {
  readonly application: Application
  readonly disabled: boolean
}) {
  const navigate = useNavigate()
  const [pending, setPending] = useState<'start' | 'deal' | null>(null)
  useDataStoreVersion()

  const showStartNegotiation = canShowStartHiringNegotiation(application)
  const showCreateDeal = canShowCreateHiringDeal(application)
  const startAction = showStartNegotiation
    ? findWorkflowAction(
        buildWorkflowContext({ application, primaryWorkflow: 'hiring', user: { userId: null, canMutate: !disabled } }),
        'start_negotiation_from_application',
      )
    : undefined
  const createDealAction = showCreateDeal
    ? findWorkflowAction(
        buildWorkflowContext({ application, primaryWorkflow: 'hiring', user: { userId: null, canMutate: !disabled } }),
        'create_deal_from_application',
      )
    : undefined
  const negotiationHref = resolveApplicationHiringNegotiationLink(application)
  const dealHref = resolveApplicationHiringDealLink(application)

  if (!showStartNegotiation && !showCreateDeal && !negotiationHref && !dealHref) {
    return null
  }

  const handleStartNegotiation = () => {
    if (pending || disabled) return
    setPending('start')
    const result = startHiringNegotiationFromApplicationUiAction(application.id)
    setPending(null)
    if (!result.success) {
      toast.error(result.message)
      return
    }
    toast.success('Hiring negotiation started', {
      description: 'Agree terms, then create the hiring deal when ready.',
    })
    navigate(`/negotiations/${result.negotiationId}`)
  }

  const handleCreateDeal = () => {
    if (pending || disabled) return
    setPending('deal')
    const result = createHiringDealFromApplicationUiAction(application.id)
    setPending(null)
    if (!result.success) {
      toast.error(result.message)
      return
    }
    toast.success('Hiring deal created', {
      description: 'Draft deal workspace is ready.',
    })
    navigate(`/deals/${result.dealId}`)
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {showStartNegotiation ? (
        <PmButton
          type="button"
          size="sm"
          disabled={disabled || pending !== null}
          onClick={handleStartNegotiation}
        >
          {pending === 'start' ? 'Starting…' : (startAction?.label ?? 'Start hiring negotiation')}
        </PmButton>
      ) : null}
      {showCreateDeal ? (
        <PmButton
          type="button"
          size="sm"
          disabled={disabled || pending !== null}
          onClick={handleCreateDeal}
        >
          {pending === 'deal' ? 'Creating…' : (createDealAction?.label ?? 'Create hiring deal')}
        </PmButton>
      ) : null}
      {negotiationHref && !showStartNegotiation ? (
        <PmButton type="button" size="sm" variant="outline" asChild>
          <Link to={negotiationHref}>View negotiation</Link>
        </PmButton>
      ) : null}
      {dealHref ? (
        <PmButton type="button" size="sm" variant="outline" asChild>
          <Link to={dealHref}>View deal</Link>
        </PmButton>
      ) : null}
    </div>
  )
}

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
      className={cn(
        'border-border/50 bg-surface-muted/40',
        variant === 'legacy' && 'border-dashed opacity-80',
      )}
    >
        <PmEmptyState
          title={
            variant === 'legacy'
              ? 'No direct applications'
              : 'No direct applications'
          }
          description={
            variant === 'legacy'
              ? APPLICATIONS_LEGACY_EMPTY_MESSAGE
              : 'No direct applications. Matches are the primary collaboration path.'
          }
          size="compact"
        />
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
          ? 'Optional hiring path — does not replace Match → Negotiation → Deal.'
          : undefined
      }
      className={cn(
        'border-border/50 bg-surface-muted/40',
        variant === 'legacy' && 'border-dashed opacity-80',
      )}
    >
      <div className="space-y-4">
        {applications.map((app) => {
          const av = matchingService.normalizeApplicationValue(app.application_value)
          const amount = matchingService.formatApplicationValueAmount(app.application_value)
          const actionable =
            canManage &&
            !opportunityClosed &&
            TRANSITIONABLE_APPLICATION_STATUSES.includes(app.status)
          const isAccepted =
            (app.status || '').toLowerCase() === 'accepted'
          const showHiringWorkflow = canManage && !opportunityClosed && isAccepted

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
              {showHiringWorkflow ? (
                <ApplicationHiringWorkflowActions
                  application={app}
                  disabled={!canManage || opportunityClosed}
                />
              ) : null}
              {canManage ? (
                <PmCardActions
                  className="mt-3"
                  primary={
                    actionable
                      ? { label: 'Accept', onClick: () => handleAccept(app.id) }
                      : { label: PRODUCT_LANGUAGE.OPEN_PROFILE, href: `/people/${app.applicantId}` }
                  }
                  secondary={
                    actionable
                      ? {
                          label: PRODUCT_LANGUAGE.OPEN_PROFILE,
                          href: `/people/${app.applicantId}`,
                          variant: 'outline',
                        }
                      : undefined
                  }
                  more={
                    actionable
                      ? [
                          {
                            id: 'reject',
                            label: 'Reject',
                            onSelect: () => handleReject(app.id),
                            variant: 'destructive',
                          },
                        ]
                      : undefined
                  }
                  moreChildren={
                    actionable ? (
                      <div
                        className="space-y-1.5 px-2 py-1.5"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        role="presentation"
                      >
                        <span className={pmTypography.label}>Update status</span>
                        <Select
                          value={app.status}
                          onValueChange={(v) => handleStatusChange(app.id, v)}
                        >
                          <SelectTrigger className="h-8 w-full cursor-pointer">
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
                      </div>
                    ) : undefined
                  }
                />
              ) : null}
            </PmSurface>
          )
        })}
      </div>
    </PmContentCard>
  )
}

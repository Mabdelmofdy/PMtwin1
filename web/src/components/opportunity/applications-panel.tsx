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
import { StatusBadge } from '@/components/shared/page-primitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <Card className="border-border/50 bg-muted/10">
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">{sectionTitle}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {variant === 'legacy'
            ? APPLICATIONS_LEGACY_EMPTY_MESSAGE
            : 'No applications yet. Published opportunities will receive applicant proposals here.'}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-muted/10">
      <CardHeader>
        <CardTitle className="text-base text-muted-foreground">
          {variant === 'legacy'
            ? `${APPLICATIONS_LEGACY_SECTION_TITLE} (${applications.length})`
            : sectionTitle}
        </CardTitle>
        {variant === 'legacy' ? (
          <p className="text-xs text-muted-foreground">
            Optional hiring path — does not replace PostMatch → Negotiation → Deal.
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
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
              className="rounded-xl border border-border/60 p-4 transition-colors hover:bg-muted/20"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">
                  {app.applicant?.profile?.name ?? app.applicant?.email ?? 'Unknown applicant'}
                </p>
                <StatusBadge status={app.status} />
                {av.valueScorePct != null ? (
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Value {av.valueScorePct}%
                  </span>
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
                  <Button size="sm" variant="outline" className="cursor-pointer" asChild>
                    <Link to={`/people/${app.applicantId}`}>View profile</Link>
                  </Button>
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
                      <Button
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => handleAccept(app.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="cursor-pointer"
                        onClick={() => handleReject(app.id)}
                      >
                        Reject
                      </Button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </article>
          )
        })}
      </CardContent>
    </Card>
  )
}

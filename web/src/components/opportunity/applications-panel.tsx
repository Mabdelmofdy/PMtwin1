import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { Application } from '@/lib/applications'
import {
  APPLICATION_STATUS_LABELS,
  TRANSITIONABLE_APPLICATION_STATUSES,
  formatApplicationValueAmount,
  normalizeApplicationValue,
} from '@/lib/applications'
import { dataStore } from '@/lib/data-store'
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

export function ApplicationsPanel({
  applications,
  canManage,
  opportunityClosed,
}: {
  applications: ApplicationWithApplicant[]
  canManage: boolean
  opportunityClosed: boolean
}) {
  const handleStatusChange = (appId: string, status: string) => {
    dataStore.updateApplication(appId, { status })
    toast.success('Application status updated')
  }

  const handleReject = (appId: string) => {
    dataStore.updateApplication(appId, { status: 'rejected' })
    toast.success('Application rejected')
  }

  const handleAccept = (appId: string) => {
    dataStore.updateApplication(appId, { status: 'accepted' })
    toast.success('Application accepted')
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Applications (0)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No applications yet. Published opportunities will receive applicant proposals here.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications ({applications.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {applications.map((app) => {
          const av = normalizeApplicationValue(app.application_value)
          const amount = formatApplicationValueAmount(app.application_value)
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

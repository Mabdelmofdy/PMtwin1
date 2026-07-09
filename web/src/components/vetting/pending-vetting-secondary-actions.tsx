import { Link } from 'react-router-dom'
import type { VettingActionQueue } from '@/components/vetting/resolve-vetting-action-queue.ts'
import { PmButton, PmWorkflowBadge } from '@/components/ui/pm-index'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmSurface } from '@/components/ui/pm-surface'
import { pmTypography } from '@/tokens'
import { cn } from '@/lib/utils'

export function PendingVettingSecondaryActions({
  actionQueue,
  className,
}: {
  readonly actionQueue: VettingActionQueue
  readonly className?: string
}) {
  const hasSecondary = Boolean(actionQueue.secondary)
  const hasAdditional = actionQueue.additional.length > 0
  const hasWaiting = Boolean(actionQueue.waiting)

  if (!hasSecondary && !hasAdditional && !hasWaiting) {
    return null
  }

  return (
    <PmContentCard title="Additional actions" className={className}>
      <ul className="space-y-2" role="list">
        {actionQueue.secondary ? (
          <li>
            <p className={cn(pmTypography.caption, 'mb-1 text-muted-foreground')}>
              Secondary action
            </p>
            <PmSurface
              variant="default"
              shadow="card"
              className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(pmTypography.bodySm, 'font-medium')}>
                  {actionQueue.secondary.title}
                </span>
                <PmWorkflowBadge status="pending" size="sm" />
              </div>
              <PmButton asChild size="sm" variant="outline" className="w-fit">
                <Link
                  to={actionQueue.secondary.link.href}
                  aria-label={actionQueue.secondary.link.label}
                >
                  {actionQueue.secondary.link.label}
                </Link>
              </PmButton>
            </PmSurface>
          </li>
        ) : null}

        {hasAdditional ? (
          <li>
            <p className={cn(pmTypography.caption, 'mb-1 text-muted-foreground')}>
              Additional recommendations
            </p>
            <ul className="space-y-2" role="list">
              {actionQueue.additional.map((action) => (
                <li key={action.title}>
                  <PmSurface
                    variant="default"
                    shadow="card"
                    className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className={cn(pmTypography.bodySm, 'font-medium')}>{action.title}</span>
                    <PmButton asChild size="sm" variant="ghost" className="w-fit">
                      <Link to={action.link.href} aria-label={action.link.label}>
                        {action.link.label}
                      </Link>
                    </PmButton>
                  </PmSurface>
                </li>
              ))}
            </ul>
          </li>
        ) : null}

        {actionQueue.waiting ? (
          <li>
            <PmSurface variant="muted" className="flex items-center gap-2 p-3.5">
              <PmWorkflowBadge status="reviewing" size="sm" />
              <span className={cn(pmTypography.bodySm, 'font-medium')}>
                {actionQueue.waiting.title}
              </span>
            </PmSurface>
          </li>
        ) : null}
      </ul>
    </PmContentCard>
  )
}

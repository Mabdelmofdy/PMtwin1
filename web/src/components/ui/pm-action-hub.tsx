import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import {
  PmCardActions,
  type PmCardActionSlot,
  type PmMoreActionItem,
} from '@/components/ui/pm-more-actions'
import { PmEmptyState } from '@/components/ui/pm-empty-state'
import { PmMatchScoreBadge } from '@/components/ui/pm-match-score-badge'
import { PmSection } from '@/components/ui/pm-section'
import { PmSurface } from '@/components/ui/pm-surface'
import { PmWorkflowBadge } from '@/components/ui/pm-workflow-badge'
import type { StatusEntity } from '@/lib/status-display'

export type PmActionHubItem = {
  id: string
  title: string
  context?: string
  status?: string
  statusEntity?: StatusEntity
  matchScore?: number
  primary: PmCardActionSlot
  secondary?: PmCardActionSlot
  more?: readonly PmMoreActionItem[]
  moreChildren?: ReactNode
}

export type PmActionHubProps = {
  title?: string
  description?: string
  items: readonly PmActionHubItem[]
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  className?: string
}

function ActionHubRow({ item }: { item: PmActionHubItem }) {
  return (
    <PmSurface
      data-slot="pm-action-hub-row"
      variant="default"
      shadow="card"
      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn(pmTypography.bodySm, 'font-medium text-foreground')}>
            {item.title}
          </p>
          {item.status ? (
            <PmWorkflowBadge status={item.status} entity={item.statusEntity} size="sm" />
          ) : null}
          {item.matchScore != null ? (
            <PmMatchScoreBadge score={item.matchScore} variant="compact" showLabel={false} />
          ) : null}
        </div>
        {item.context ? (
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>{item.context}</p>
        ) : null}
      </div>
      <PmCardActions
        className="w-full border-t-0 pt-0 sm:w-auto sm:shrink-0 sm:border-t-0"
        align="end"
        primary={item.primary}
        secondary={item.secondary}
        more={item.more}
        moreChildren={item.moreChildren}
      />
    </PmSurface>
  )
}

/** Attention-first list of the most important next actions. */
export function PmActionHub({
  title = 'Needs your action',
  description,
  items,
  emptyTitle = 'You are caught up',
  emptyDescription = 'No urgent workflow steps right now. Check recommended matches or open the pipeline.',
  emptyAction,
  className,
}: PmActionHubProps) {
  return (
    <PmSection title={title} description={description} className={className}>
      {items.length === 0 ? (
        <PmEmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          size="compact"
        />
      ) : (
        <ul className="space-y-3" role="list">
          {items.map((item) => (
            <li key={item.id}>
              <ActionHubRow item={item} />
            </li>
          ))}
        </ul>
      )}
    </PmSection>
  )
}

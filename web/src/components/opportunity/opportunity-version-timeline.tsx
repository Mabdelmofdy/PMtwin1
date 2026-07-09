import { PmFormSection } from '@/components/forms/pm-form-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import type { Opportunity } from '@/types/domain.ts'

export type VersionTimelineEvent = {
  id: string
  label: string
  at?: string
  active: boolean
}

/**
 * Lifecycle Version Timeline — separate from Activity Timeline.
 * Draft Created → Updated → Published → Archived → Republished
 */
export function buildVersionTimelineEvents(
  opportunity: Opportunity | null | undefined,
): VersionTimelineEvent[] {
  if (!opportunity) {
    return [
      { id: 'draft', label: 'Draft Created', active: false },
      { id: 'updated', label: 'Updated', active: false },
      { id: 'published', label: 'Published', active: false },
      { id: 'archived', label: 'Archived', active: false },
      { id: 'republished', label: 'Republished', active: false },
    ]
  }

  const status = (opportunity.status ?? '').toLowerCase()
  const visibility = (opportunity.visibilityStatus ?? '').toLowerCase()
  const createdAt = opportunity.createdAt
  const updatedAt = opportunity.updatedAt
  const wasUpdated = Boolean(
    createdAt && updatedAt && updatedAt !== createdAt,
  )
  const isPublished = status === 'published' || visibility === 'published'
  const isArchived = visibility === 'archived'
  const isRepublished =
    isPublished &&
    wasUpdated &&
    Boolean((opportunity as { republishedAt?: string }).republishedAt)

  return [
    {
      id: 'draft',
      label: 'Draft Created',
      at: createdAt,
      active: true,
    },
    {
      id: 'updated',
      label: 'Updated',
      at: wasUpdated ? updatedAt : undefined,
      active: wasUpdated,
    },
    {
      id: 'published',
      label: 'Published',
      active: isPublished || isArchived || isRepublished,
    },
    {
      id: 'archived',
      label: 'Archived',
      active: isArchived,
    },
    {
      id: 'republished',
      label: 'Republished',
      active: isRepublished,
    },
  ]
}

export function OpportunityVersionTimeline({
  opportunity,
}: {
  opportunity?: Opportunity | null
}) {
  const events = buildVersionTimelineEvents(opportunity)
  return (
    <PmFormSection
      title="Version timeline"
      description="Lifecycle visualization — separate from the activity feed."
    >
      <ol
        className="space-y-0"
        data-testid="opportunity-version-timeline"
      >
        {events.map((event, index) => (
          <li key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'mt-1 size-2.5 rounded-full',
                  event.active ? 'bg-primary' : 'bg-border',
                )}
              />
              {index < events.length - 1 ? (
                <span className="my-1 w-px flex-1 bg-border" />
              ) : null}
            </div>
            <div className="pb-4">
              <p
                className={cn(
                  'text-sm font-medium',
                  !event.active && 'text-muted-foreground',
                )}
              >
                {event.label}
              </p>
              {event.at ? (
                <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                  {event.at}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </PmFormSection>
  )
}

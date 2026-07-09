import type { TimelineEventStatus } from './severity.ts'

export type TimelineEvent = {
  readonly type: string
  readonly title: string
  readonly description: string
  readonly timestamp: string
  readonly status: TimelineEventStatus
  readonly relatedEntity?: string
}

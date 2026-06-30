import {
  OpportunityTimeline,
  type OpportunityTimelineEvent,
} from '@/components/opportunity/opportunity-timeline'
import type { CollaborationFlowStep } from '@/components/opportunity/opportunity-collaboration-constants'

export type CollaborationTimelineEvent = OpportunityTimelineEvent

export type CollaborationTimelineProps = {
  activeStep?: CollaborationFlowStep
  events?: readonly CollaborationTimelineEvent[]
  className?: string
  title?: string
}

/** Shared collaboration workflow timeline — path strip + activity events. */
export function CollaborationTimeline(props: CollaborationTimelineProps) {
  return <OpportunityTimeline {...props} />
}

export type { CollaborationFlowStep }

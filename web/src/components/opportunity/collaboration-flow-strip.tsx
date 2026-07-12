import { OpportunityTimeline } from '@/components/opportunity/opportunity-timeline'

export {
  COLLABORATION_FLOW_STEPS,
  type CollaborationFlowStep,
} from '@/components/opportunity/opportunity-collaboration-constants'

type CollaborationFlowStripProps = {
  readonly activeStep?: import('@/components/opportunity/opportunity-collaboration-constants').CollaborationFlowStep
  readonly className?: string
}

/** Collaboration path indicator — delegates to OpportunityTimeline.
 * @deprecated Not mounted on Opportunity Details 4.0 — use `PmWorkflowJourney`.
 * Retained for collaboration UX unit tests only.
 */
export function CollaborationFlowStrip({
  activeStep = 'Opportunity',
  className,
}: CollaborationFlowStripProps) {
  return (
    <OpportunityTimeline activeStep={activeStep} className={className} />
  )
}

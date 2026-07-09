import { PmWorkflowBadge } from '@/components/ui/pm-workflow-badge'

/** Opportunity lifecycle status — delegates to canonical PmWorkflowBadge. */
export function OpportunityStatusBadge({
  status,
}: {
  status: string
}) {
  return <PmWorkflowBadge status={status} entity="opportunity" size="sm" />
}

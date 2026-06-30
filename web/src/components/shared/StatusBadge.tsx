import { toCanonical } from '@pm-twin/lifecycle'
import type { WorkflowEntityType } from '@/domain/workflow/types.ts'
import { PmWorkflowBadge } from '@/components/ui/pm-workflow-badge'
import type { StatusEntity } from '@/lib/status-display'

const WORKFLOW_TO_STATUS_ENTITY: Partial<Record<WorkflowEntityType, StatusEntity>> = {
  opportunity: 'opportunity',
  deal: 'deal',
  contract: 'contract',
  negotiation: 'negotiation',
  match: 'match',
  application: 'application',
}

export function normalizeStatus(
  entityType: WorkflowEntityType,
  status: string | null | undefined,
): string {
  if (status == null || status === '') return ''
  return toCanonical(entityType, status)
}

/** @deprecated Prefer PmWorkflowBadge directly — kept for workflow module consumers. */
export function StatusBadge({
  entityType,
  status,
  className,
}: {
  entityType: WorkflowEntityType
  status: string
  className?: string
}) {
  const canonical = normalizeStatus(entityType, status)
  const entity = WORKFLOW_TO_STATUS_ENTITY[entityType]

  return (
    <PmWorkflowBadge
      status={canonical || status}
      entity={entity}
      className={className}
    />
  )
}

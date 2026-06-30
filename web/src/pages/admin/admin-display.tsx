import {
  PmWorkflowBadge,
  resolveWorkflowStatusTone,
} from '@/components/ui/pm-workflow-badge'
import type { StatusEntity } from '@/lib/status-display'

/** @deprecated Use resolveWorkflowStatusTone — kept for admin tests. */
export const resolveAdminStatusTone = resolveWorkflowStatusTone

export function AdminStatusBadge({
  status,
  entity,
}: {
  status: string
  entity?: StatusEntity
}) {
  return <PmWorkflowBadge status={status} entity={entity} size="sm" />
}

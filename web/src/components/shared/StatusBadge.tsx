import { toCanonical } from '@pm-twin/lifecycle'
import type { WorkflowEntityType } from '@/domain/workflow/types.ts'
import { StatusBadge as StatusBadgeView } from '@/components/shared/page-primitives.tsx'

export function normalizeStatus(
  entityType: WorkflowEntityType,
  status: string | null | undefined,
): string {
  if (status == null || status === '') return ''
  return toCanonical(entityType, status)
}

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
  return (
    <StatusBadgeView status={canonical || status} className={className} />
  )
}

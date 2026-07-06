export type WorkflowEntityBrowseKey =
  | 'opportunity'
  | 'match'
  | 'negotiation'
  | 'deal'
  | 'contract'

/** Canonical browse routes for workflow entity access-denied recovery. */
export const ENTITY_BROWSE_ROUTES: Record<WorkflowEntityBrowseKey, string> = {
  opportunity: '/opportunities',
  match: '/matches',
  negotiation: '/negotiations',
  deal: '/deals',
  contract: '/contracts',
}

export const ENTITY_BROWSE_BACK_LABELS: Record<WorkflowEntityBrowseKey, string> = {
  opportunity: 'Back to opportunities',
  match: 'Back to matches',
  negotiation: 'Back to negotiations',
  deal: 'Back to deals',
  contract: 'Back to contracts',
}

export function resolveEntityBrowseBackHref(
  entity: WorkflowEntityBrowseKey,
): string {
  return ENTITY_BROWSE_ROUTES[entity]
}

export function resolveEntityBrowseBackLabel(
  entity: WorkflowEntityBrowseKey,
): string {
  return ENTITY_BROWSE_BACK_LABELS[entity]
}

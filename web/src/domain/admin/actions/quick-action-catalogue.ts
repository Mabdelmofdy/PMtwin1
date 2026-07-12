import type { AdminCapability } from '@/domain/rbac/roles/permission-bundles.ts'
import type { AdminQuickActionDefinition } from '@/domain/admin/read-models/types.ts'

/** Static quick-action catalogue — wire to commands in later phases. */
export const ADMIN_QUICK_ACTION_CATALOGUE: readonly AdminQuickActionDefinition[] = [
  { id: 'user.activate', label: 'Activate', entityType: 'user', requiredPermission: 'admin.users.manage', commandType: 'ActivateUser', sensitive: true, requiresReason: true },
  { id: 'user.suspend', label: 'Suspend', entityType: 'user', requiredPermission: 'admin.users.manage', commandType: 'SuspendUser', sensitive: true, requiresReason: true },
  { id: 'user.unsuspend', label: 'Unsuspend', entityType: 'user', requiredPermission: 'admin.users.manage', commandType: 'UnsuspendUser', sensitive: true, requiresReason: true },
  { id: 'user.lock', label: 'Lock', entityType: 'user', requiredPermission: 'admin.users.manage', commandType: 'LockUser', sensitive: true, requiresReason: true },
  { id: 'user.unlock', label: 'Unlock', entityType: 'user', requiredPermission: 'admin.users.manage', commandType: 'UnlockUser', sensitive: true },
  { id: 'user.assign_role', label: 'Assign role', entityType: 'user', requiredPermission: 'admin.roles.assign', commandType: 'AssignUserRole', sensitive: true, requiresReason: true },
  { id: 'user.open_party', label: 'Open Party', entityType: 'user', requiredPermission: 'admin.parties.read', href: '/admin/parties' },
  { id: 'user.open_audit', label: 'Open Audit', entityType: 'user', requiredPermission: 'admin.audit.read', href: '/admin/audit' },
  { id: 'user.add_note', label: 'Add internal note', entityType: 'user', requiredPermission: 'admin.users.manage', commandType: 'AddUserInternalNote' },
  { id: 'opportunity.moderate', label: 'Moderate', entityType: 'opportunity', requiredPermission: 'admin.opportunities.moderate', commandType: 'ModerateOpportunity', sensitive: true, requiresReason: true },
  { id: 'opportunity.unpublish', label: 'Unpublish', entityType: 'opportunity', requiredPermission: 'admin.opportunities.moderate', commandType: 'CloseOpportunity', sensitive: true, requiresReason: true },
  { id: 'opportunity.rerun_matching', label: 'Rerun matching', entityType: 'opportunity', requiredPermission: 'admin.matching.execute', commandType: 'RerunMatching' },
  { id: 'commercial_agreement.approve', label: 'Approve', entityType: 'commercial_agreement', requiredPermission: 'admin.commercial_agreements.approve', commandType: 'RecordDecisionApproval', sensitive: true, requiresReason: true },
  { id: 'commercial_agreement.award', label: 'Award', entityType: 'commercial_agreement', requiredPermission: 'admin.commercial_agreements.award', commandType: 'AwardCommercialAgreement', sensitive: true, requiresReason: true },
  { id: 'commercial_agreement.open_award', label: 'Open award comparison', entityType: 'commercial_agreement', requiredPermission: 'admin.commercial_agreements.award', href: '/admin/awards' },
  { id: 'vetting.approve', label: 'Approve vetting', entityType: 'vetting', requiredPermission: 'admin.vetting.manage', commandType: 'ApproveVetting', sensitive: true, requiresReason: true },
  { id: 'vetting.reject', label: 'Reject vetting', entityType: 'vetting', requiredPermission: 'admin.vetting.manage', commandType: 'RejectVetting', sensitive: true, requiresReason: true },
] as const

export function quickActionsForEntity(
  entityType: string,
): readonly AdminQuickActionDefinition[] {
  return ADMIN_QUICK_ACTION_CATALOGUE.filter((action) => action.entityType === entityType)
}

export function isQuickActionAllowed(
  action: AdminQuickActionDefinition,
  hasCapability: (capability: AdminCapability) => boolean,
): boolean {
  return hasCapability(action.requiredPermission as AdminCapability)
}

import type { PlatformRole, WorkspaceCapability, WorkspaceRole } from './types.ts'

const ALL_CAPABILITIES: readonly WorkspaceCapability[] = [
  'opportunity.create',
  'opportunity.edit',
  'opportunity.publish',
  'match.respond',
  'negotiation.manage',
  'agreement.approve',
  'agreement.award',
  'contract.prepare',
  'contract.sign',
  'workspace.members.manage',
  'workspace.settings.manage',
] as const

const ROLE_CAPABILITIES: Readonly<Record<WorkspaceRole, readonly WorkspaceCapability[]>> = {
  workspace_owner: ALL_CAPABILITIES,
  company_admin: ALL_CAPABILITIES,
  manager: [
    'opportunity.create',
    'opportunity.edit',
    'opportunity.publish',
    'match.respond',
    'negotiation.manage',
    'agreement.approve',
    'contract.prepare',
  ],
  commercial_manager: [
    'opportunity.create',
    'opportunity.edit',
    'opportunity.publish',
    'match.respond',
    'negotiation.manage',
    'agreement.approve',
    'agreement.award',
    'contract.prepare',
  ],
  project_manager: [
    'opportunity.create',
    'opportunity.edit',
    'opportunity.publish',
    'match.respond',
    'negotiation.manage',
    'contract.prepare',
  ],
  legal: [
    'negotiation.manage',
    'agreement.approve',
    'contract.prepare',
    'contract.sign',
  ],
  finance: [
    'agreement.approve',
    'agreement.award',
    'contract.prepare',
  ],
  member: [
    'opportunity.create',
    'opportunity.edit',
    'match.respond',
    'negotiation.manage',
  ],
  viewer: [],
}

export function resolveWorkspaceCapabilities(
  role: WorkspaceRole,
): readonly WorkspaceCapability[] {
  return ROLE_CAPABILITIES[role] ?? []
}

export function hasWorkspaceCapability(
  context: {
    readonly capabilities?: readonly WorkspaceCapability[]
    readonly workspaceRole?: WorkspaceRole
  },
  capability: WorkspaceCapability,
): boolean {
  const caps =
    context.capabilities ??
    (context.workspaceRole
      ? resolveWorkspaceCapabilities(context.workspaceRole)
      : [])
  return caps.includes(capability)
}

const PLATFORM_ROLE_SET = new Set<string>([
  'platform_admin',
  'admin',
  'moderator',
  'auditor',
  'support',
  'super_admin',
])

export function isPlatformRole(role: string): role is PlatformRole {
  return PLATFORM_ROLE_SET.has(role)
}

/** Staged migration: map legacy PlatformUser.role → platform roles. */
export function resolveLegacyRoleToPlatformRoles(
  legacyRole: string | undefined | null,
): readonly PlatformRole[] {
  if (!legacyRole) return []
  const normalized = legacyRole.trim().toLowerCase()
  if (normalized === 'super_admin' || normalized === 'platform_admin') {
    return ['platform_admin']
  }
  if (normalized === 'admin') return ['admin']
  if (normalized === 'moderator') return ['moderator']
  if (normalized === 'auditor') return ['auditor']
  if (normalized === 'support' || normalized === 'support_admin') return ['support']
  return []
}

/** Staged migration: map legacy marketplace role → workspace membership role. */
export function resolveLegacyRoleToWorkspaceMembership(
  legacyRole: string | undefined | null,
): WorkspaceRole | null {
  if (!legacyRole) return null
  const normalized = legacyRole.trim().toLowerCase()
  if (normalized === 'company_owner') return 'workspace_owner'
  if (normalized === 'professional' || normalized === 'user') return 'workspace_owner'
  if (isPlatformRole(normalized)) return null
  return 'member'
}

export function isBusinessWorkspaceType(
  type: string,
): type is 'personal' | 'company' {
  return type === 'personal' || type === 'company'
}

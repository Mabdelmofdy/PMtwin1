import type { BusinessWorkspace, WorkspaceMembership } from '@pm-twin/identity'

export type DeepLinkContextResolution =
  | {
      readonly status: 'same_workspace'
      readonly workspaceId: string
    }
  | {
      readonly status: 'switch_required'
      readonly targetWorkspaceId: string
      readonly destinationPath: string
    }
  | {
      readonly status: 'forbidden'
      readonly reason: string
    }
  | {
      readonly status: 'admin_portal'
      readonly destinationPath: string
    }

/**
 * Resolve deep-link entity access without loading under the wrong Workspace.
 * Admin deep-links stay in Admin Portal and never switch Marketplace context.
 */
export function resolveDeepLinkWorkspaceContext(input: {
  readonly destinationPath: string
  readonly entityWorkspaceId?: string
  readonly activeWorkspaceId?: string
  readonly memberships: readonly WorkspaceMembership[]
  readonly workspaces: readonly BusinessWorkspace[]
  readonly isAdminPath?: boolean
}): DeepLinkContextResolution {
  if (input.isAdminPath || input.destinationPath.startsWith('/admin')) {
    return {
      status: 'admin_portal',
      destinationPath: input.destinationPath,
    }
  }

  const entityWorkspaceId = input.entityWorkspaceId
  if (!entityWorkspaceId) {
    return { status: 'forbidden', reason: 'Entity has no workspace context' }
  }

  if (input.activeWorkspaceId === entityWorkspaceId) {
    return { status: 'same_workspace', workspaceId: entityWorkspaceId }
  }

  const hasMembership = input.memberships.some(
    (membership) =>
      membership.workspaceId === entityWorkspaceId &&
      membership.status === 'active',
  )
  const workspaceExists = input.workspaces.some(
    (workspace) =>
      workspace.id === entityWorkspaceId && workspace.status === 'active',
  )

  if (!hasMembership || !workspaceExists) {
    return {
      status: 'forbidden',
      reason: 'No active membership for the entity workspace',
    }
  }

  return {
    status: 'switch_required',
    targetWorkspaceId: entityWorkspaceId,
    destinationPath: input.destinationPath,
  }
}

import type {
  BusinessWorkspace,
  MarketplaceParty,
  PlatformRole,
  WorkspaceMembership,
} from '@pm-twin/identity'
import type { PlatformUser } from '@/types/domain.ts'
import { useAuth } from '@/providers/auth-provider.tsx'

export function useCurrentUser(): PlatformUser | null {
  return useAuth().user
}

export function useActiveWorkspace(): BusinessWorkspace | null {
  return useAuth().activeWorkspace
}

export function useActiveParty(): MarketplaceParty | null {
  return useAuth().activeParty
}

export function useWorkspaceMembership(
  workspaceId?: string,
): WorkspaceMembership | null {
  const { memberships, activeWorkspace } = useAuth()
  const targetWorkspaceId = workspaceId ?? activeWorkspace?.id
  return memberships.find(
    (membership) =>
      membership.workspaceId === targetWorkspaceId &&
      membership.status === 'active',
  ) ?? null
}

export function usePlatformRole(role: PlatformRole): boolean {
  return useAuth().platformRoles.includes(role)
}

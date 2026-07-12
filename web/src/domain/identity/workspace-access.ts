import { canAccessWorkspaceEntity } from '@pm-twin/identity'

export type WorkspaceScoped = {
  readonly workspaceId?: string
}

export function filterByActiveWorkspace<T extends WorkspaceScoped>(
  items: readonly T[],
  activeWorkspaceId: string | undefined,
): T[] {
  return items.filter((item) =>
    canAccessWorkspaceEntity({
      activeWorkspaceId,
      entityWorkspaceId: item.workspaceId,
    }),
  )
}

export function assertWorkspaceAccess(
  entity: WorkspaceScoped,
  activeWorkspaceId: string | undefined,
): void {
  if (
    !canAccessWorkspaceEntity({
      activeWorkspaceId,
      entityWorkspaceId: entity.workspaceId,
    })
  ) {
    throw new Error('Workspace access denied')
  }
}

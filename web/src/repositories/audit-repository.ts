import type { AuditEntry } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { getCommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'
import { REPOSITORY_ENTITY_KEYS } from './repository-entity-keys.ts'
import { BaseRepository } from './base-repository.ts'
import { mergeAuditEntries } from './seed-override-merge.ts'

export class AuditRepository extends BaseRepository<AuditEntry> {
  constructor(storage: IStorageAdapter, loadSeed: () => AuditEntry[]) {
    super(storage, REPOSITORY_ENTITY_KEYS.audit, loadSeed)
  }

  override getAll(): AuditEntry[] {
    const overrides = this.readOverrides()
    return mergeAuditEntries(this.loadSeed(), overrides)
  }

  append(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const actor = getCommandPermissionActor()
    const overrides = this.readOverrides()
    const auditEntry: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      actorUserId: entry.actorUserId ?? actor?.userId ?? entry.userId,
      actorType:
        entry.actorType ??
        actor?.actorType ??
        (actor?.platformRoles && actor.platformRoles.length > 0
          ? 'platform_operator'
          : entry.userId
            ? 'marketplace_user'
            : 'system'),
      workspaceId: entry.workspaceId ?? actor?.activeWorkspaceId,
      partyId: entry.partyId ?? actor?.activePartyId,
      workspaceRole: entry.workspaceRole ?? actor?.workspaceRole,
      platformRole: entry.platformRole ?? actor?.platformRoles?.[0],
      userId: entry.userId ?? actor?.userId,
    }
    overrides.newAuditEntries = [
      ...(overrides.newAuditEntries ?? []),
      auditEntry,
    ]
    this.writeOverrides(overrides)
    return auditEntry
  }
}

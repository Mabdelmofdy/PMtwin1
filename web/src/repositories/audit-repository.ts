import type { AuditEntry } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { BaseRepository } from './base-repository.ts'

export class AuditRepository extends BaseRepository<AuditEntry> {
  constructor(storage: IStorageAdapter, loadSeed: () => AuditEntry[]) {
    super(storage, 'applications', loadSeed)
  }

  override getAll(): AuditEntry[] {
    const base = this.loadSeed()
    const overrides = this.readOverrides()
    return [...base, ...(overrides.newAuditEntries ?? [])]
  }

  append(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const overrides = this.readOverrides()
    const auditEntry: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    }
    overrides.newAuditEntries = [
      ...(overrides.newAuditEntries ?? []),
      auditEntry,
    ]
    this.writeOverrides(overrides)
    return auditEntry
  }
}

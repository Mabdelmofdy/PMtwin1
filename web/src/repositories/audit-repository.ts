import type { AuditEntry } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { BaseRepository } from './base-repository.ts'

export class AuditRepository extends BaseRepository<AuditEntry> {
  constructor(storage: IStorageAdapter, loadSeed: () => AuditEntry[]) {
    super(storage, 'applications', loadSeed)
  }
}

import type { PostMatch } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { BaseRepository } from './base-repository.ts'

export class PostMatchRepository extends BaseRepository<PostMatch> {
  constructor(storage: IStorageAdapter, loadSeed: () => PostMatch[]) {
    super(storage, 'applications', loadSeed)
  }

  getByUser(userId: string): PostMatch[] {
    return this.getAll().filter((m) =>
      m.participants.some((p) => p.userId === userId),
    )
  }

  getByOpportunity(opportunityId: string): PostMatch[] {
    return this.getAll().filter(
      (m) =>
        m.payload?.needOpportunityId === opportunityId ||
        m.payload?.offerOpportunityId === opportunityId,
    )
  }
}

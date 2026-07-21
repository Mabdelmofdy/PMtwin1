import type { PostMatch } from '@/types/domain.ts'

import type { IStorageAdapter } from '@/types/storage.ts'

import { toCanonical } from '@pm-twin/lifecycle'

import {

  collectPostMatchOpportunityIds,

  computePostMatchStrongKeyFromMatch,

} from '@/domain/normalized/post-match-strong-key.ts'

import { BaseRepository } from './base-repository.ts'
import { mergeSeedWithOverrides } from './seed-override-merge.ts'



const POST_MATCH_ENTITY = 'match' as const



export function isBlockingDiscoverDuplicateStatus(

  status: string | undefined,

): boolean {

  const canonical = toCanonical(POST_MATCH_ENTITY, status ?? '') ?? ''

  return canonical === 'discovered' || canonical === 'accepted'

}



export class PostMatchRepository extends BaseRepository<PostMatch> {

  constructor(storage: IStorageAdapter, loadSeed: () => PostMatch[]) {

    super(storage, 'postMatches', loadSeed)

  }



  override getAll(): PostMatch[] {

    const overrides = this.readOverrides()

    return mergeSeedWithOverrides({

      seed: this.loadSeed(),

      patches: (overrides.postMatches ?? {}) as Record<string, Partial<PostMatch>>,

      newItems: overrides.newPostMatches ?? [],

      deletedIds: overrides.deletedPostMatches ?? [],

    })

  }



  getByUser(userId: string): PostMatch[] {

    return this.getAll().filter((m) =>

      m.participants.some(

        (p) =>

          p.userId === userId ||

          p.representativeUserIds?.includes(userId),

      ),

    )

  }



  getByOpportunity(opportunityId: string): PostMatch[] {

    return this.getAll().filter((m) =>

      collectPostMatchOpportunityIds(m).includes(opportunityId),

    )

  }



  /**

   * Find an active duplicate by topology strong key (ADR-MATCH-001).

   */

  findActiveDuplicateByStrongKey(strongKey: string): PostMatch | undefined {

    if (!strongKey) return undefined

    return this.getAll().find((match) => {

      if (match.isReplacement) return false

      const key = computePostMatchStrongKeyFromMatch(match)

      if (key !== strongKey) return false

      return isBlockingDiscoverDuplicateStatus(match.status)

    })

  }



  /**

   * @deprecated Prefer findActiveDuplicateByStrongKey — one_way pair shortcut.

   */

  findActiveDiscoverDuplicate(

    needOpportunityId: string,

    offerOpportunityId: string,

    matchType: string,

  ): PostMatch | undefined {

    const strongKey = computePostMatchStrongKeyFromMatch({

      id: '',

      matchType,

      status: 'discovered',

      matchScore: 0,

      participants: [],

      needOpportunityId,

      offerOpportunityId,

    })

    if (!strongKey) return undefined

    return this.findActiveDuplicateByStrongKey(strongKey)

  }



  create(record: PostMatch): PostMatch {

    const overrides = this.readOverrides()

    const now = new Date().toISOString()

    const postMatch: PostMatch = {

      ...record,

      createdAt: record.createdAt ?? now,

      updatedAt: record.updatedAt ?? now,

    }

    overrides.newPostMatches = [

      ...(overrides.newPostMatches ?? []),

      postMatch,

    ]

    this.writeOverrides(overrides)

    return postMatch

  }



  update(id: string, patch: Partial<PostMatch>): void {

    const overrides = this.readOverrides()

    const newPostMatches = overrides.newPostMatches ?? []

    const isNew = newPostMatches.some((m) => m.id === id)

    if (isNew) {

      overrides.newPostMatches = newPostMatches.map((m) =>

        m.id === id

          ? { ...m, ...patch, updatedAt: new Date().toISOString() }

          : m,

      )

    } else {

      const existing = (overrides.postMatches ?? {}) as Record<

        string,

        Partial<PostMatch>

      >

      overrides.postMatches = {

        ...existing,

        [id]: {

          ...existing[id],

          ...patch,

          updatedAt: new Date().toISOString(),

        },

      }

    }

    this.writeOverrides(overrides)

  }

}



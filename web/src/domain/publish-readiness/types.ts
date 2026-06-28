import type { OpportunityReadinessResult } from '@/domain/opportunity-readiness/types.ts'
import type {
  ProfileKind,
  ProfileReadinessResult,
} from '@/domain/profile-readiness/types.ts'

export type PublishReadinessInput = {
  readonly profile?: object | null
  readonly profileKind: ProfileKind
  readonly opportunity?: object | null
}

export type PublishReadinessResult = {
  readonly allowed: boolean
  readonly code?: 'PUBLISH_READINESS_BLOCKED'
  readonly reason?: string
  readonly profileReadiness: ProfileReadinessResult
  readonly opportunityReadiness: OpportunityReadinessResult
  readonly missingProfileRequired: readonly string[]
  readonly missingProfileRecommended: readonly string[]
  readonly missingOpportunityRequired: readonly string[]
  readonly missingOpportunityRecommended: readonly string[]
}

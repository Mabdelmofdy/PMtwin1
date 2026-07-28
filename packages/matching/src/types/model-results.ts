import type { MatchingModelName } from './match-result.ts'
import type { ScoreBreakdown, ScoreLabels } from './match-result.ts'
import type { MatchingRunDiagnostic } from '../diagnostics/matching-diagnostics.ts'

export interface SuggestedPartner {
  readonly opportunityId?: string
  readonly creatorId?: string
  readonly role?: string
}

export interface ScoredMatch {
  readonly matchScore: number
  readonly breakdown?: ScoreBreakdown | Readonly<Record<string, number>>
  readonly labels?: ScoreLabels
  readonly valueAnalysis?: Readonly<Record<string, unknown>>
  readonly valueEquivalence?: string
  readonly suggestedPartners: readonly SuggestedPartner[]
  readonly needOpportunityId?: string
  readonly offerOpportunityId?: string
  readonly role?: string
  readonly cycle?: readonly string[]
  readonly linkScores?: readonly CircularLinkScore[]
  readonly links?: readonly CircularLinkScore[]
}

export interface CircularLinkScore {
  readonly fromCreatorId: string
  readonly toCreatorId: string
  readonly needId: string
  readonly offerId: string
  readonly score: number
}

export interface ModelRunResultBase {
  readonly model: MatchingModelName
  readonly matches: readonly ScoredMatch[]
  /** Per-candidate diagnostics — present for all matching model runners. */
  readonly diagnostic?: MatchingRunDiagnostic
}

export interface OneWayMatchResult extends ModelRunResultBase {
  readonly model: 'one_way'
  readonly direction?: 'offer_to_needs'
}

export interface TwoWayMatchResult extends ModelRunResultBase {
  readonly model: 'two_way'
}

export interface ConsortiumRoleResult {
  readonly role: string
  readonly opportunityId?: string
  readonly creatorId?: string
  readonly matchScore: number
}

export interface ConsortiumMatchResult extends ModelRunResultBase {
  readonly model: 'consortium'
  readonly roles: readonly string[]
  readonly roleResults?: readonly ConsortiumRoleResult[]
  readonly complete: boolean
}

export interface CircularMatchResult extends ModelRunResultBase {
  readonly model: 'circular'
}

export interface ModelRunnerOptions {
  readonly maxCandidates?: number
  readonly topN?: number
  readonly minCycleLength?: number
}

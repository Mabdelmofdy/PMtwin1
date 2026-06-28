export type OpportunityReadinessStatus =
  | 'incomplete'
  | 'needs_review'
  | 'ready_for_matching'

export type OpportunityReadinessResult = {
  readonly score: number
  readonly status: OpportunityReadinessStatus
  readonly missingRequired: readonly string[]
  readonly missingRecommended: readonly string[]
  readonly presentRequired: readonly string[]
  readonly presentRecommended: readonly string[]
}

/** Loose opportunity bag — supports canonical and legacy POC/web seed field names. */
export type OpportunityReadinessOpportunity = Readonly<Record<string, unknown>>

export type OpportunityFieldRule = {
  readonly label: string
  readonly isPresent: (opportunity: OpportunityReadinessOpportunity) => boolean
}

export interface ValueExchangeNormalized {
  readonly totalOffered: number
  readonly totalExpected: number
  readonly riskAdjustedOffered: number
  readonly riskAdjustedExpected: number
}

export interface ValueExchange {
  readonly mode?: string
  readonly accepted_modes?: readonly string[]
  readonly estimated_value?: number
  readonly _normalized?: ValueExchangeNormalized
}

export interface NormalizedBudget {
  readonly min?: number
  readonly max?: number
  readonly currency?: string
}

export interface NormalizedTimeline {
  readonly start?: string
  readonly end?: string
  readonly durationDays?: number
}

export interface NormalizedPost {
  readonly role?: string
  readonly requiredServices?: readonly string[]
  readonly offeredServices?: readonly string[]
  readonly coreSkills?: readonly string[]
  readonly skills?: readonly string[]
  readonly budget?: NormalizedBudget
  readonly location?: string
  readonly deadline?: string
  readonly timeline?: NormalizedTimeline
  readonly availability?: {
    readonly start?: string
    readonly end?: string
  }
  readonly modelType?: string
  readonly subModelType?: string
  readonly categories?: readonly string[]
  readonly reputation?: number
  readonly intent?: string
}

export interface OpportunityPost {
  readonly id?: string
  readonly intent?: string
  readonly status?: string
  readonly creatorId?: string
  readonly exchangeMode?: string
  readonly subModelType?: string
  readonly modelType?: string
  readonly title?: string
  readonly description?: string
  readonly location?: string
  readonly locationRegion?: string
  readonly locationCity?: string
  readonly locationCountry?: string
  readonly attributes?: Readonly<Record<string, unknown>>
  readonly scope?: Readonly<Record<string, unknown>>
  readonly exchangeData?: Readonly<Record<string, unknown>>
  readonly normalized?: NormalizedPost
  readonly value_exchange?: ValueExchange
}

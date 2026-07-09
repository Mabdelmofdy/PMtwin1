export type ProfileReadinessStatus =
  | 'incomplete'
  | 'needs_review'
  | 'ready_for_matching'

export type ProfileReadinessResult = {
  readonly score: number
  readonly status: ProfileReadinessStatus
  readonly missingRequired: readonly string[]
  readonly missingRecommended: readonly string[]
  readonly recommendations: readonly string[]
}

export type ProfileKind = 'individual' | 'company'

/** Loose profile bag — supports canonical and legacy POC field names. */
export type ProfileReadinessProfile = Readonly<Record<string, unknown>>

export type ProfileReadinessInput = {
  readonly profileKind: ProfileKind
  readonly profile?: ProfileReadinessProfile | null
  readonly respectCompletionLock?: boolean
}

export type ProfileFieldRule = {
  readonly label: string
  readonly isPresent: (profile: ProfileReadinessProfile) => boolean
}

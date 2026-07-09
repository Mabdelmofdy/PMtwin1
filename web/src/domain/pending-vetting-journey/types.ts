export type PendingJourneyStepId =
  | 'account_created'
  | 'email_verified'
  | 'profile_completion'
  | 'upload_documents'
  | 'admin_review'
  | 'approved'

export type PendingJourneyStepState = 'completed' | 'current' | 'pending' | 'blocked'

export type PendingJourneyStep = {
  readonly id: PendingJourneyStepId
  readonly label: string
  readonly state: PendingJourneyStepState
  readonly href?: string
}

export type OverallOnboardingProgress = {
  readonly percent: number
  readonly profileWeight: number
  readonly vettingWeight: number
  readonly adminApprovalWeight: number
  readonly adminApprovalProgress: number
}

export type PendingVettingJourneyResult = {
  readonly steps: readonly PendingJourneyStep[]
  readonly overallOnboarding: OverallOnboardingProgress
  readonly stepsRemaining: number
  readonly nextBestAction: string
}

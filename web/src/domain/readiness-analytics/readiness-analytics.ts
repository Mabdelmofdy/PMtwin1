import { evaluateOpportunityReadiness } from '@/domain/opportunity-readiness/opportunity-readiness-evaluator.ts'
import type { OpportunityReadinessOpportunity } from '@/domain/opportunity-readiness/types.ts'
import { evaluateProfileReadiness } from '@/domain/profile-readiness/profile-readiness-evaluator.ts'
import type { ProfileReadinessProfile } from '@/domain/profile-readiness/types.ts'
import { evaluatePublishReadiness } from '@/domain/publish-readiness/publish-readiness-gate.ts'
import { resolveCanonicalStatus } from '@/lib/status-display.ts'
import type {
  BuildReadinessAnalyticsInput,
  ReadinessAnalyticsOpportunitySummary,
  ReadinessAnalyticsProfileSummary,
  ReadinessAnalyticsResult,
} from '@/domain/readiness-analytics/types.ts'

const EMPTY_PROFILE_SUMMARY: ReadinessAnalyticsProfileSummary = {
  total: 0,
  ready: 0,
  needsReview: 0,
  incomplete: 0,
  averageScore: 0,
}

const EMPTY_OPPORTUNITY_SUMMARY: ReadinessAnalyticsOpportunitySummary = {
  total: 0,
  ready: 0,
  needsReview: 0,
  incomplete: 0,
  draft: 0,
  publishBlocked: 0,
  averageScore: 0,
}

function roundAverage(value: number): number {
  return Math.round(value * 100) / 100
}

function averageScore(scores: readonly number[]): number {
  if (scores.length === 0) return 0
  const total = scores.reduce((sum, score) => sum + score, 0)
  return roundAverage(total / scores.length)
}

function isDraftOpportunity(opportunity: object): boolean {
  const status = (opportunity as { status?: string }).status
  if (!status) return false
  return status === 'draft' || resolveCanonicalStatus('opportunity', status) === 'draft'
}

function summarizeProfiles(
  profiles: BuildReadinessAnalyticsInput['profiles'],
): ReadinessAnalyticsProfileSummary {
  if (profiles.length === 0) {
    return EMPTY_PROFILE_SUMMARY
  }

  let ready = 0
  let needsReview = 0
  let incomplete = 0
  const scores: number[] = []

  for (const entry of profiles) {
    const result = evaluateProfileReadiness({
      profileKind: entry.profileKind,
      profile: (entry.profile ?? undefined) as ProfileReadinessProfile | undefined,
    })
    scores.push(result.score)

    if (result.status === 'ready_for_matching') ready += 1
    else if (result.status === 'needs_review') needsReview += 1
    else incomplete += 1
  }

  return {
    total: profiles.length,
    ready,
    needsReview,
    incomplete,
    averageScore: averageScore(scores),
  }
}

function summarizeOpportunities(
  opportunities: BuildReadinessAnalyticsInput['opportunities'],
  resolveProfileForOpportunity: BuildReadinessAnalyticsInput['resolveProfileForOpportunity'],
): ReadinessAnalyticsOpportunitySummary {
  if (opportunities.length === 0) {
    return EMPTY_OPPORTUNITY_SUMMARY
  }

  let ready = 0
  let needsReview = 0
  let incomplete = 0
  let draft = 0
  let publishBlocked = 0
  const scores: number[] = []

  for (const opportunity of opportunities) {
    const result = evaluateOpportunityReadiness(
      opportunity as OpportunityReadinessOpportunity,
    )
    scores.push(result.score)

    if (result.status === 'ready_for_matching') ready += 1
    else if (result.status === 'needs_review') needsReview += 1
    else incomplete += 1

    if (!isDraftOpportunity(opportunity)) continue

    draft += 1
    const publishContext = resolveProfileForOpportunity(opportunity)
    if (publishContext === null) {
      publishBlocked += 1
      continue
    }

    const publishGate = evaluatePublishReadiness({
      profile: publishContext.profile,
      profileKind: publishContext.profileKind,
      opportunity,
    })

    if (!publishGate.allowed) {
      publishBlocked += 1
    }
  }

  return {
    total: opportunities.length,
    ready,
    needsReview,
    incomplete,
    draft,
    publishBlocked,
    averageScore: averageScore(scores),
  }
}

export function buildReadinessAnalytics(
  input: BuildReadinessAnalyticsInput,
): ReadinessAnalyticsResult {
  return {
    profiles: summarizeProfiles(input.profiles ?? []),
    opportunities: summarizeOpportunities(
      input.opportunities ?? [],
      input.resolveProfileForOpportunity,
    ),
  }
}

export function createCreatorProfileResolver(
  getPersonById: (id: string) => { profile?: object | null } | undefined,
): BuildReadinessAnalyticsInput['resolveProfileForOpportunity'] {
  return (opportunity) => {
    const creatorId = (opportunity as { creatorId?: string }).creatorId
    if (!creatorId) return null

    const creator = getPersonById(creatorId)
    if (!creator) return null

    const profileKind =
      (creator.profile as { type?: string } | undefined)?.type === 'company'
        ? 'company'
        : 'individual'

    return {
      profile: creator.profile,
      profileKind,
    }
  }
}

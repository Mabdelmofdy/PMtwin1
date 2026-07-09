import type { ExplainabilityAdapter } from './explainability-adapter.ts'
import type { DashboardExplainabilitySnapshot } from './dashboard-types.ts'
import { DASHBOARD_REASON_CODES } from '../reason-codes/dashboard.ts'
import { ENGINE_ID } from '../types/engine.ts'
import { HEALTH } from '../types/health.ts'
import type { ExplanationBundle } from '../types/bundle.ts'
import type { BlockingFactor } from '../types/blocking.ts'
import type {
  ExplanationReason,
  StrengthWeaknessEntry,
} from '../types/reason.ts'
import type { Recommendation } from '../types/recommendation.ts'
import type { ScoreBreakdownEntry } from '../types/score-breakdown.ts'
import type { TimelineEvent } from '../types/timeline.ts'
import {
  EXPLANATION_SEVERITY,
  RECOMMENDATION_PRIORITY,
} from '../types/severity.ts'

export const DASHBOARD_ADAPTER_VERSION = '1.0.0' as const

export const DASHBOARD_ADAPTER_SCORE_WEIGHTS = {
  profileReadiness: 25,
  vettingReadiness: 20,
  pipelineActivity: 25,
  workflowMomentum: 20,
  contractExecution: 10,
} as const

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function resolveGeneratedAt(input: DashboardExplainabilitySnapshot): string {
  return input.evaluatedAt ?? new Date().toISOString()
}

function resolveActivityScore(input: DashboardExplainabilitySnapshot): number {
  const counts = [
    input.opportunityCount ?? 0,
    input.matchCount ?? 0,
    input.negotiationCount ?? 0,
    input.dealCount ?? 0,
    input.contractCount ?? 0,
  ]
  const total = counts.reduce((sum, value) => sum + value, 0)
  if (total === 0) return 0
  return roundScore(Math.min(100, 20 + total * 8))
}

function resolveWorkflowMomentum(input: DashboardExplainabilitySnapshot): number {
  const negotiations = input.negotiationCount ?? 0
  const deals = input.dealCount ?? 0
  const contracts = input.contractCount ?? 0
  if (negotiations + deals + contracts === 0) return 30
  return roundScore(Math.min(100, 40 + deals * 15 + contracts * 10))
}

function computeDashboardScore(input: DashboardExplainabilitySnapshot): number {
  const profile = input.profileScore ?? 0
  const vetting = input.vettingScore ?? 100
  const activity = resolveActivityScore(input)
  const momentum = resolveWorkflowMomentum(input)
  const contracts = input.contractCount ?? 0
  const contractScore = contracts > 0 ? 100 : 50

  const weighted =
    (profile * DASHBOARD_ADAPTER_SCORE_WEIGHTS.profileReadiness +
      vetting * DASHBOARD_ADAPTER_SCORE_WEIGHTS.vettingReadiness +
      activity * DASHBOARD_ADAPTER_SCORE_WEIGHTS.pipelineActivity +
      momentum * DASHBOARD_ADAPTER_SCORE_WEIGHTS.workflowMomentum +
      contractScore * DASHBOARD_ADAPTER_SCORE_WEIGHTS.contractExecution) /
    100

  return roundScore(weighted)
}

function resolveHealth(score: number): (typeof HEALTH)[keyof typeof HEALTH] {
  if (score >= 85) return HEALTH.EXCELLENT
  if (score >= 70) return HEALTH.GOOD
  if (score >= 50) return HEALTH.WARNING
  return HEALTH.CRITICAL
}

function hasStalledPipeline(input: DashboardExplainabilitySnapshot): boolean {
  const matches = input.matchCount ?? 0
  const negotiations = input.negotiationCount ?? 0
  const deals = input.dealCount ?? 0
  return matches > 0 && negotiations === 0 && deals === 0
}

function hasActionRequired(input: DashboardExplainabilitySnapshot): boolean {
  const profileLow = (input.profileScore ?? 100) < 70
  const vettingLow = input.vettingScore != null && input.vettingScore < 70
  const pendingRecs = (input.aggregatedRecommendations?.length ?? 0) > 0
  return profileLow || vettingLow || pendingRecs
}

function buildReasons(
  input: DashboardExplainabilitySnapshot,
): readonly ExplanationReason[] {
  const reasons: ExplanationReason[] = []

  if (hasActionRequired(input)) {
    reasons.push({
      code: DASHBOARD_REASON_CODES.ACTION_REQUIRED,
      message: 'Workspace items need attention to keep the pipeline moving.',
      severity: EXPLANATION_SEVERITY.WARNING,
      category: 'attention',
    })
  }

  if (hasStalledPipeline(input)) {
    reasons.push({
      code: DASHBOARD_REASON_CODES.PIPELINE_STALLED,
      message: 'Matches exist but no negotiations or agreements have started.',
      severity: EXPLANATION_SEVERITY.WARNING,
      category: 'pipeline',
    })
  }

  if ((input.profileScore ?? 100) < 60 || (input.vettingScore ?? 100) < 60) {
    reasons.push({
      code: DASHBOARD_REASON_CODES.DEADLINE_APPROACHING,
      message: 'Readiness gaps may block upcoming publish or matching deadlines.',
      severity: EXPLANATION_SEVERITY.INFO,
      category: 'readiness',
    })
  }

  if (input.heroMetric) {
    reasons.push({
      code: DASHBOARD_REASON_CODES.ACTION_REQUIRED,
      message: `${input.heroMetric.label}: ${input.heroMetric.value}`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: 'hero',
    })
  }

  return reasons
}

function buildBlockers(
  input: DashboardExplainabilitySnapshot,
): readonly BlockingFactor[] {
  const blockers: BlockingFactor[] = []

  if ((input.profileScore ?? 100) < 50) {
    blockers.push({
      reasonCode: DASHBOARD_REASON_CODES.ACTION_REQUIRED,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: 'Complete required profile fields from the dashboard recommendations.',
    })
  }

  if (input.vettingScore != null && input.vettingScore < 50) {
    blockers.push({
      reasonCode: DASHBOARD_REASON_CODES.ACTION_REQUIRED,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: 'Upload pending compliance documents to unblock matching.',
    })
  }

  return blockers
}

function buildStrengths(
  input: DashboardExplainabilitySnapshot,
): readonly StrengthWeaknessEntry[] {
  const strengths: StrengthWeaknessEntry[] = []

  if ((input.profileScore ?? 0) >= 80) {
    strengths.push({
      code: DASHBOARD_REASON_CODES.ACTION_REQUIRED,
      label: 'Strong profile readiness',
      impactPercent: DASHBOARD_ADAPTER_SCORE_WEIGHTS.profileReadiness,
    })
  }

  if ((input.contractCount ?? 0) > 0) {
    strengths.push({
      code: DASHBOARD_REASON_CODES.PIPELINE_STALLED,
      label: 'Active contract execution',
      impactPercent: DASHBOARD_ADAPTER_SCORE_WEIGHTS.contractExecution,
    })
  }

  return strengths
}

function buildWeaknesses(
  input: DashboardExplainabilitySnapshot,
): readonly StrengthWeaknessEntry[] {
  const weaknesses: StrengthWeaknessEntry[] = []

  if (hasStalledPipeline(input)) {
    weaknesses.push({
      code: DASHBOARD_REASON_CODES.PIPELINE_STALLED,
      label: 'Pipeline stalled after matching',
      impactPercent: DASHBOARD_ADAPTER_SCORE_WEIGHTS.workflowMomentum,
    })
  }

  if ((input.opportunityCount ?? 0) === 0) {
    weaknesses.push({
      code: DASHBOARD_REASON_CODES.DEADLINE_APPROACHING,
      label: 'No active opportunities',
      impactPercent: DASHBOARD_ADAPTER_SCORE_WEIGHTS.pipelineActivity,
    })
  }

  return weaknesses
}

function buildRecommendationsFromSnapshot(
  input: DashboardExplainabilitySnapshot,
): readonly Recommendation[] {
  const recommendations: Recommendation[] = []
  let index = 0
  const score = computeDashboardScore(input)

  for (const rec of input.aggregatedRecommendations ?? []) {
    recommendations.push({
      ...rec,
      id: rec.id || `dashboard-agg-${index}`,
    })
    index += 1
  }

  if ((input.profileScore ?? 100) < 80) {
    recommendations.push({
      id: `dashboard-rec-profile-${index}`,
      label: 'Improve profile readiness',
      reasonCode: DASHBOARD_REASON_CODES.ACTION_REQUIRED,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: 15,
      estimatedScore: roundScore(Math.min(100, score + 12)),
      href: '/settings/profile',
      category: 'profile',
      severity: EXPLANATION_SEVERITY.WARNING,
    })
    index += 1
  }

  if (hasStalledPipeline(input)) {
    recommendations.push({
      id: `dashboard-rec-pipeline-${index}`,
      label: 'Review matches and start negotiations',
      reasonCode: DASHBOARD_REASON_CODES.PIPELINE_STALLED,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: 20,
      estimatedScore: roundScore(Math.min(100, score + 15)),
      href: '/matches',
      category: 'pipeline',
      severity: EXPLANATION_SEVERITY.WARNING,
    })
    index += 1
  }

  if ((input.opportunityCount ?? 0) > 0 && (input.matchCount ?? 0) === 0) {
    recommendations.push({
      id: `dashboard-rec-matching-${index}`,
      label: 'Run matching on published opportunities',
      reasonCode: DASHBOARD_REASON_CODES.ACTION_REQUIRED,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: 12,
      estimatedScore: roundScore(Math.min(100, score + 10)),
      href: '/opportunities',
      category: 'matching',
      severity: EXPLANATION_SEVERITY.INFO,
    })
  }

  return recommendations
}

function buildBreakdownFromSnapshot(
  input: DashboardExplainabilitySnapshot,
): readonly ScoreBreakdownEntry[] {
  const entries: ScoreBreakdownEntry[] = [
    {
      label: 'Profile readiness',
      score: input.profileScore ?? 0,
      weight: DASHBOARD_ADAPTER_SCORE_WEIGHTS.profileReadiness,
      maxScore: 100,
      reasonCodes:
        (input.profileScore ?? 100) < 70
          ? [DASHBOARD_REASON_CODES.ACTION_REQUIRED]
          : [],
    },
    {
      label: 'Vetting readiness',
      score: input.vettingScore ?? 100,
      weight: DASHBOARD_ADAPTER_SCORE_WEIGHTS.vettingReadiness,
      maxScore: 100,
      reasonCodes: [],
    },
    {
      label: 'Pipeline activity',
      score: resolveActivityScore(input),
      weight: DASHBOARD_ADAPTER_SCORE_WEIGHTS.pipelineActivity,
      maxScore: 100,
      reasonCodes: hasStalledPipeline(input)
        ? [DASHBOARD_REASON_CODES.PIPELINE_STALLED]
        : [],
    },
    {
      label: 'Workflow momentum',
      score: resolveWorkflowMomentum(input),
      weight: DASHBOARD_ADAPTER_SCORE_WEIGHTS.workflowMomentum,
      maxScore: 100,
      reasonCodes: [],
    },
    {
      label: 'Contract execution',
      score: (input.contractCount ?? 0) > 0 ? 100 : 50,
      weight: DASHBOARD_ADAPTER_SCORE_WEIGHTS.contractExecution,
      maxScore: 100,
      reasonCodes: [],
    },
  ]

  return entries
}

function buildTimelineFromSnapshot(
  _input: DashboardExplainabilitySnapshot,
): readonly TimelineEvent[] {
  return []
}

function buildSummary(input: DashboardExplainabilitySnapshot, score: number): string {
  if (input.heroMetric) {
    return `Dashboard health ${Math.round(score)}% — focus on ${input.heroMetric.label.toLowerCase()}.`
  }
  if (hasStalledPipeline(input)) {
    return `Dashboard health ${Math.round(score)}% — pipeline activity has stalled after matching.`
  }
  return `Dashboard health ${Math.round(score)}% across profile, pipeline, and execution signals.`
}

export function buildDashboardExplanation(
  input: DashboardExplainabilitySnapshot,
): ExplanationBundle {
  const score = computeDashboardScore(input)
  const generatedAt = resolveGeneratedAt(input)

  return {
    engine: ENGINE_ID.DASHBOARD,
    entityId: input.entityId,
    score,
    health: resolveHealth(score),
    summary: buildSummary(input, score),
    scoreBreakdown: buildBreakdownFromSnapshot(input),
    reasons: buildReasons(input),
    blockers: buildBlockers(input),
    strengths: buildStrengths(input),
    weaknesses: buildWeaknesses(input),
    recommendations: buildRecommendationsFromSnapshot(input),
    timeline: buildTimelineFromSnapshot(input),
    metadata: {
      generatedAt,
      engineVersion: DASHBOARD_ADAPTER_VERSION,
      locale: input.locale ?? 'en',
      source: 'dashboard-adapter',
      tags: ['workspace'],
      extensions: {
        opportunityCount: input.opportunityCount,
        matchCount: input.matchCount,
        negotiationCount: input.negotiationCount,
        dealCount: input.dealCount,
        contractCount: input.contractCount,
        heroMetric: input.heroMetric,
      },
    },
  }
}

export const dashboardExplainabilityAdapter: ExplainabilityAdapter<DashboardExplainabilitySnapshot> =
  {
    buildExplanation: buildDashboardExplanation,
    buildRecommendations: buildRecommendationsFromSnapshot,
    buildBreakdown: buildBreakdownFromSnapshot,
    buildTimeline: buildTimelineFromSnapshot,
  }

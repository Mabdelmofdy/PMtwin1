import type { MatchExplainabilitySnapshot, MatchTopology } from '@pm-twin/explainability'
import type { PostMatch } from '@/types/domain.ts'

const MATCH_TOPOLOGIES = new Set<MatchTopology>([
  'one_way',
  'two_way',
  'consortium',
  'circular',
])

function normalizeTopology(matchType?: string): MatchTopology | undefined {
  const key = (matchType ?? 'one_way').toLowerCase()
  return MATCH_TOPOLOGIES.has(key as MatchTopology) ? (key as MatchTopology) : undefined
}

function pickBreakdownValue(
  breakdown: Record<string, number>,
  key: string,
): number {
  const value = breakdown[key]
  return Number.isFinite(value) ? value : 0
}

export type MatchSnapshotOptions = {
  readonly locale?: string
  readonly topologyReason?: string
}

export function buildMatchExplainabilitySnapshot(
  match: PostMatch,
  options?: MatchSnapshotOptions,
): MatchExplainabilitySnapshot {
  const raw = match.payload?.breakdown ?? match.matchCriteria ?? {}

  return {
    entityId: match.id,
    matchScore: match.matchScore,
    topology: normalizeTopology(match.matchType),
    topologyReason: options?.topologyReason,
    breakdown: {
      skillMatch: pickBreakdownValue(raw, 'skillMatch'),
      exchangeCompatibility: pickBreakdownValue(raw, 'exchangeCompatibility'),
      valueCompatibility: pickBreakdownValue(raw, 'valueCompatibility'),
      budgetFit: pickBreakdownValue(raw, 'budgetFit'),
      timelineFit: pickBreakdownValue(raw, 'timelineFit'),
      locationFit: pickBreakdownValue(raw, 'locationFit'),
      reputation: pickBreakdownValue(raw, 'reputation'),
      serviceOverlapPct: raw.serviceOverlapPct,
      attributeOverlap: raw.attributeOverlap,
    },
    counterpartEntityId: match.offerOpportunityId ?? match.needOpportunityId,
    evaluatedAt: match.updatedAt ?? match.createdAt,
    locale: options?.locale ?? 'en-SA',
  }
}

import type { MatchingModelName, RankedMatch } from '../types/match-result.ts'

export function rankMatches(
  matches: readonly RankedMatch[],
  _model?: MatchingModelName,
): RankedMatch[] {
  return (matches ?? []).map((match) => {
    const valueAnalysis = match.valueAnalysis
    let valueFit: string | null = (valueAnalysis?.valueFit as string | undefined) ?? null
    if (!valueFit && valueAnalysis?.equivalence) {
      const equivalenceScore = (valueAnalysis.equivalence as { equivalenceScore?: number }).equivalenceScore
      if (equivalenceScore != null && equivalenceScore >= 0.7) {
        valueFit = 'strong'
      }
    }
    const coverageRatio = (valueAnalysis?.coverageRatio as number | undefined) != null
      ? (valueAnalysis?.coverageRatio as number)
      : (valueAnalysis?.equivalence
        ? (((valueAnalysis.equivalence as { aCoversB?: number; bCoversA?: number }).aCoversB ?? 0)
          + ((valueAnalysis.equivalence as { aCoversB?: number; bCoversA?: number }).bCoversA ?? 0)) / 2
        : 0.5)
    const repScore = match.breakdown?.reputation != null ? match.breakdown.reputation : 0.5
    const timelineScore = match.breakdown?.timelineFit != null ? match.breakdown.timelineFit : 0.5
    const compositeRank = 0.50 * (match.matchScore ?? 0)
      + 0.30 * (coverageRatio != null ? Math.min(coverageRatio, 1) : 0.5)
      + 0.10 * repScore
      + 0.10 * timelineScore
    const tier = (match.matchScore ?? 0) >= 0.85 && valueFit === 'strong'
      ? 'top'
      : (match.matchScore ?? 0) >= 0.70
        ? 'good'
        : 'possible'
    const recommendation = {
      tier,
      reason: tier === 'top'
        ? 'Strong skill and value fit'
        : (tier === 'good' ? 'Good match; review value terms' : 'Possible match; negotiation may be needed'),
      actionRequired: tier === 'top'
        ? 'Ready to contract'
        : (tier === 'good' ? 'Review and negotiate' : 'Negotiate value exchange'),
    } as const
    return {
      ...match,
      compositeRank,
      recommendation,
      scoreBreakdown: match.breakdown,
    }
  }).sort((a, b) => (
    (b.compositeRank != null ? b.compositeRank : b.matchScore ?? 0)
    - (a.compositeRank != null ? a.compositeRank : a.matchScore ?? 0)
  ))
}

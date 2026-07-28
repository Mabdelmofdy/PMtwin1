import { scorePair } from '../scoring/post-to-post-scoring.ts'
import { passesPair } from '../constraints/hard-constraints.ts'
import {
  diagnoseGateAndScore,
  summarizeDiagnostics,
  type MatchingCandidateDiagnostic,
} from '../diagnostics/matching-diagnostics.ts'
import type { CanonicalData } from '../types/canonical.ts'
import type { MatchingConfig } from '../types/matching-config.ts'
import type {
  CircularLinkScore,
  CircularMatchResult,
  ModelRunnerOptions,
  ScoredMatch,
  SuggestedPartner,
} from '../types/model-results.ts'
import type { OpportunityPost } from '../types/opportunity.ts'
import {
  resolveNormalized,
  resolveThreshold,
  withRunnerConfig,
} from './shared.ts'

export interface CircularEdgeDetail {
  readonly score: number
  readonly need: OpportunityPost
  readonly offer: OpportunityPost
}

export type CircularEdgeMap = Readonly<Record<string, CircularEdgeDetail>>

export function normalizeCycleRing(cycle: readonly string[]): string[] {
  if (!Array.isArray(cycle) || !cycle.length) return []
  const ring = cycle.filter(Boolean)
  if (ring.length > 1 && ring[0] === ring[ring.length - 1]) {
    return ring.slice(0, -1)
  }
  return ring
}

export function buildCircularLinkScores(
  ring: readonly string[],
  edgeDetails: CircularEdgeMap,
): CircularLinkScore[] | null {
  if (!ring || ring.length < 2) return null
  const linkScores: CircularLinkScore[] = []
  for (let index = 0; index < ring.length; index++) {
    const fromCreatorId = ring[index]
    const toCreatorId = ring[(index + 1) % ring.length]
    const detail = edgeDetails[`${fromCreatorId}->${toCreatorId}`]
    if (
      !detail
      || !detail.need
      || !detail.offer
      || detail.need.id == null
      || detail.offer.id == null
      || detail.score == null
    ) {
      return null
    }
    linkScores.push({
      fromCreatorId,
      toCreatorId,
      needId: detail.need.id,
      offerId: detail.offer.id,
      score: detail.score,
    })
  }
  return linkScores
}

function buildCreatorGraph(
  needPosts: readonly OpportunityPost[],
  offerPosts: readonly OpportunityPost[],
  config: MatchingConfig,
  canonical: CanonicalData,
  threshold: number,
): {
  outEdges: Record<string, string[]>
  edgeDetails: CircularEdgeMap
  diagnostics: MatchingCandidateDiagnostic[]
} {
  const outEdges: Record<string, string[]> = {}
  const edgeDetails: Record<string, CircularEdgeDetail> = {}
  const diagnostics: MatchingCandidateDiagnostic[] = []

  for (const need of needPosts) {
    const needNorm = resolveNormalized(need, canonical, config)
    const fromCreator = need.creatorId
    if (!fromCreator) continue

    for (const offer of offerPosts) {
      if (offer.creatorId === fromCreator) continue
      const offerNorm = resolveNormalized(offer, canonical, config)
      const gate = passesPair(need, offer, config, { needNorm, offerNorm })
      const scored = gate.ok
        ? scorePair(need, offer, config, needNorm, offerNorm)
        : undefined
      const diagnostic = diagnoseGateAndScore({
        candidateOpportunityId: String(offer.id ?? ''),
        gate,
        scored,
        threshold,
      })
      diagnostics.push(diagnostic)

      if (!gate.ok || !scored || scored.score < threshold || !offer.creatorId) continue

      const toCreator = offer.creatorId
      if (!outEdges[fromCreator]) outEdges[fromCreator] = []
      if (!outEdges[fromCreator].includes(toCreator)) outEdges[fromCreator].push(toCreator)

      const key = `${fromCreator}->${toCreator}`
      if (!edgeDetails[key] || scored.score > edgeDetails[key].score) {
        edgeDetails[key] = { score: scored.score, need, offer }
      }
    }
  }

  return { outEdges, edgeDetails, diagnostics }
}

function findCycles(
  outEdges: Readonly<Record<string, readonly string[]>>,
  minCycleLength: number,
): string[][] {
  const creatorIds = [
    ...new Set([
      ...Object.keys(outEdges),
      ...Object.values(outEdges).flat(),
    ]),
  ]
  const cycles: string[][] = []
  const path: string[] = []
  const pathSet = new Set<string>()

  function visit(node: string, depth: number, startNode: string): void {
    if (depth >= minCycleLength && node === startNode && path.length >= minCycleLength) {
      cycles.push([...path])
      return
    }
    if (depth >= 6) return

    const list = outEdges[node] ?? []
    for (const next of list) {
      if (pathSet.has(next) && next !== startNode) continue
      if (depth >= minCycleLength - 1 && next === startNode) {
        path.push(next)
        cycles.push([...path])
        path.pop()
        continue
      }
      pathSet.add(next)
      path.push(next)
      visit(next, depth + 1, startNode)
      path.pop()
      pathSet.delete(next)
    }
  }

  creatorIds.forEach((start) => {
    path.length = 0
    pathSet.clear()
    pathSet.add(start)
    visit(start, 0, start)
  })

  return cycles
}

export function findCircularExchangesPure(
  needPosts: readonly OpportunityPost[],
  offerPosts: readonly OpportunityPost[],
  config: MatchingConfig,
  canonical: CanonicalData = {},
  options: ModelRunnerOptions = {},
): CircularMatchResult {
  const resolvedConfig = withRunnerConfig(config)
  const threshold = resolveThreshold(resolvedConfig)
  const minCycleLength = options.minCycleLength ?? 3
  const sourceId = String(needPosts[0]?.id ?? offerPosts[0]?.id ?? 'circular')
  const { outEdges, edgeDetails, diagnostics } = buildCreatorGraph(
    needPosts,
    offerPosts,
    resolvedConfig,
    canonical,
    threshold,
  )

  const cycles = findCycles(outEdges, minCycleLength)
  const uniqueCycles: ScoredMatch[] = []
  const seen = new Set<string>()

  for (const cycle of cycles) {
    const ring = normalizeCycleRing(cycle)
    if (ring.length < minCycleLength) continue

    const key = ring.slice().sort().join('|')
    if (seen.has(key)) continue
    seen.add(key)

    const linkScores = buildCircularLinkScores(ring, edgeDetails)
    if (!linkScores || linkScores.length < minCycleLength) continue

    let cycleScore = 0
    const suggestedPartners: SuggestedPartner[] = []
    for (const link of linkScores) {
      cycleScore += link.score
      suggestedPartners.push({
        opportunityId: link.offerId,
        creatorId: link.toCreatorId,
      })
    }
    cycleScore = ring.length > 0 ? cycleScore / ring.length : 0

    uniqueCycles.push({
      matchScore: cycleScore,
      cycle: ring,
      suggestedPartners,
      linkScores,
      links: linkScores,
    })
  }

  uniqueCycles.sort((a, b) => b.matchScore - a.matchScore)
  return {
    model: 'circular',
    matches: uniqueCycles,
    diagnostic: summarizeDiagnostics(sourceId, diagnostics),
  }
}

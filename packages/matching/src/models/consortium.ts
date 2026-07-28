import { getCandidates } from '../candidates/candidate-generator.ts'
import { scorePair } from '../scoring/post-to-post-scoring.ts'
import { passesPair } from '../constraints/hard-constraints.ts'
import {
  buildRejectedDiagnostic,
  diagnoseGateAndScore,
  diagnosticCheck,
  MATCHING_REJECT_REASONS,
  summarizeDiagnostics,
  type MatchingCandidateDiagnostic,
} from '../diagnostics/matching-diagnostics.ts'
import type { CanonicalData } from '../types/canonical.ts'
import type { MatchingConfig } from '../types/matching-config.ts'
import type {
  ConsortiumMatchResult,
  ConsortiumRoleResult,
  ModelRunnerOptions,
  ScoredMatch,
  SuggestedPartner,
} from '../types/model-results.ts'
import type { OpportunityPost } from '../types/opportunity.ts'
import { findOffersForNeedPure } from './one-way.ts'
import {
  buildSyntheticNeedForRole,
  parseRoleDefinitions,
  resolveNormalized,
  resolveThreshold,
  withRunnerConfig,
} from './shared.ts'

export function findConsortiumMatchesPure(
  leadNeed: OpportunityPost,
  offerPosts: readonly OpportunityPost[],
  config: MatchingConfig,
  canonical: CanonicalData = {},
  options: ModelRunnerOptions = {},
): ConsortiumMatchResult {
  const resolvedConfig = withRunnerConfig(config)
  const sourceId = String(leadNeed.id ?? '')
  const roleDefs = parseRoleDefinitions(leadNeed.attributes)
  const roles = roleDefs.map((roleDef) => roleDef.role)

  if (roles.length === 0) {
    const oneWay = findOffersForNeedPure(leadNeed, offerPosts, resolvedConfig, canonical, {
      topN: options.topN ?? 10,
      maxCandidates: options.maxCandidates,
    })
    return {
      model: 'consortium',
      roles: ['General'],
      roleResults: [],
      complete: oneWay.matches.length > 0,
      matches: oneWay.matches.map((match) => ({ ...match, role: 'General' })),
      diagnostic: oneWay.diagnostic ?? summarizeDiagnostics(sourceId, []),
    }
  }

  const threshold = resolveThreshold(resolvedConfig)
  const leadNorm = resolveNormalized(leadNeed, canonical, resolvedConfig)
  const usedCreatorIds = new Set(leadNeed.creatorId ? [leadNeed.creatorId] : [])
  const suggestedPartners: SuggestedPartner[] = []
  const roleResults: ConsortiumRoleResult[] = []
  const diagnostics: MatchingCandidateDiagnostic[] = []

  for (const roleDef of roleDefs) {
    const role = roleDef.role
    const syntheticNeed = buildSyntheticNeedForRole(leadNeed, leadNorm, roleDef)
    const candidates = getCandidates(syntheticNeed, offerPosts, resolvedConfig, {
      needNormalized: syntheticNeed.normalized,
      maxCandidates: options.maxCandidates ?? 50,
    })

    let best: OpportunityPost | null = null
    let bestScore = threshold
    let bestScoredDiagnostic: MatchingCandidateDiagnostic | null = null

    for (const offer of candidates) {
      if (offer.creatorId && usedCreatorIds.has(offer.creatorId)) continue
      const offerNorm = resolveNormalized(offer, canonical, resolvedConfig)
      const gate = passesPair(syntheticNeed, offer, resolvedConfig, {
        needNorm: syntheticNeed.normalized ?? {},
        offerNorm,
      })
      const scored = gate.ok
        ? scorePair(
          syntheticNeed,
          offer,
          resolvedConfig,
          syntheticNeed.normalized,
          offerNorm,
        )
        : undefined
      const diagnostic = diagnoseGateAndScore({
        candidateOpportunityId: String(offer.id ?? `${role}:${offer.creatorId ?? ''}`),
        gate,
        scored,
        threshold,
      })
      diagnostics.push({
        ...diagnostic,
        // Tag role in detail without changing reject codes
        checks: diagnostic.checks.map((c) =>
          c.id === 'target_role' && c.detail
            ? { ...c, detail: `${c.detail} (role slot: ${role})` }
            : c.id === 'target_role'
              ? { ...c, detail: `Role slot: ${role}` }
              : c,
        ),
      })

      if (!gate.ok || !scored || scored.score <= bestScore) continue
      bestScore = scored.score
      best = offer
      bestScoredDiagnostic = diagnostic
    }

    if (best) {
      if (best.creatorId) usedCreatorIds.add(best.creatorId)
      roleResults.push({
        role,
        opportunityId: best.id,
        creatorId: best.creatorId,
        matchScore: bestScore,
      })
      suggestedPartners.push({
        opportunityId: best.id,
        creatorId: best.creatorId,
        role,
      })
      if (bestScoredDiagnostic) {
        // Ensure winning slot is marked matched
        const idx = diagnostics.findIndex(
          (d) => d.candidateOpportunityId === bestScoredDiagnostic.candidateOpportunityId
            && d.result === 'matched',
        )
        if (idx < 0) {
          diagnostics.push({ ...bestScoredDiagnostic, result: 'matched', postMatchCreated: true })
        }
      }
    } else {
      diagnostics.push(
        buildRejectedDiagnostic({
          candidateOpportunityId: `role:${role}`,
          rejectReason: MATCHING_REJECT_REASONS.ROLE_UNFILLED,
          checks: [
            diagnosticCheck('published', 'pass'),
            diagnosticCheck('target_role', 'pass', `Role slot: ${role}`),
            diagnosticCheck('skills', 'fail', `No compatible offer for role ${role}`),
            diagnosticCheck('threshold', 'fail'),
          ],
        }),
      )
    }
  }

  const aggregateScore = roleResults.length > 0
    ? roleResults.reduce((sum, result) => sum + result.matchScore, 0) / roleResults.length
    : 0
  const complete = roleResults.length === roles.length

  const breakdown = roleResults.reduce<Record<string, number>>((accumulator, result) => {
    accumulator[result.role] = result.matchScore
    return accumulator
  }, {})

  return {
    model: 'consortium',
    roles,
    roleResults,
    complete,
    matches: complete || roleResults.length > 0
      ? [{
        matchScore: aggregateScore,
        breakdown,
        suggestedPartners,
      } satisfies ScoredMatch]
      : [],
    diagnostic: summarizeDiagnostics(sourceId, diagnostics),
  }
}

import { passesPair } from '../constraints/hard-constraints.ts'
import type { MatchingConfig } from '../types/matching-config.ts'
import type { NormalizedPost, OpportunityPost } from '../types/opportunity.ts'

export interface CandidateGeneratorOptions {
  readonly maxCandidates?: number
  readonly needNormalized?: NormalizedPost
  readonly offerNormalized?: NormalizedPost
}

export function budgetCompatible(needNorm: NormalizedPost, offerNorm: NormalizedPost): boolean {
  const needB = needNorm.budget ?? {}
  const offerB = offerNorm.budget ?? {}
  const needMin = needB.min != null ? needB.min : 0
  const needMax = needB.max != null ? needB.max : Number.POSITIVE_INFINITY
  const offerMin = offerB.min != null ? offerB.min : 0
  const offerMax = offerB.max != null ? offerB.max : Number.POSITIVE_INFINITY
  if (
    needMax === Number.POSITIVE_INFINITY
    && needMin === 0
    && offerMin === 0
    && offerMax === Number.POSITIVE_INFINITY
  ) {
    return true
  }
  return Math.max(needMin, offerMin) <= Math.min(needMax, offerMax)
}

export function locationCompatible(
  _needNorm: NormalizedPost,
  _offerNorm: NormalizedPost,
): boolean {
  // Location is a soft score factor (coverage hierarchy), never a hard reject.
  return true
}

export function timelineOverlap(needNorm: NormalizedPost, offerNorm: NormalizedPost): boolean {
  const needEnd = needNorm.deadline ?? needNorm.timeline?.end
  const needStart = needNorm.timeline?.start
  const offerStart = offerNorm.availability?.start ?? offerNorm.timeline?.start
  const offerEnd = offerNorm.availability?.end ?? offerNorm.timeline?.end
  if (!needEnd && !needStart && !offerStart && !offerEnd) return true
  const toDate = (value: string | undefined): number | null => (value ? new Date(value).getTime() : null)
  const nEnd = toDate(needEnd)
  const nStart = toDate(needStart)
  const oStart = toDate(offerStart)
  const oEnd = toDate(offerEnd)
  if (nEnd == null && nStart == null && oStart == null && oEnd == null) return true
  if (nEnd != null && oStart != null && oStart > nEnd) return false
  if (oEnd != null && nStart != null && nStart > oEnd) return false
  return true
}

function normalizeToken(value: string | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed.toLowerCase() : undefined
}

function collaborationModelTokens(norm: NormalizedPost): Set<string> {
  return new Set(
    [normalizeToken(norm.modelType), normalizeToken(norm.subModelType)].filter(
      (token): token is string => Boolean(token),
    ),
  )
}

/** Sector / profession categories only — never modelType or subModelType. */
export function sectorCategoryTokens(norm: NormalizedPost): string[] {
  const exclude = collaborationModelTokens(norm)
  const seen = new Set<string>()
  const tokens: string[] = []
  for (const raw of norm.categories ?? []) {
    const token = normalizeToken(raw)
    if (!token || exclude.has(token) || seen.has(token)) continue
    seen.add(token)
    tokens.push(token)
  }
  return tokens
}

/**
 * Hard eligibility for collaboration model / sub-model.
 * Empty on either side is not a reject. Shared modelType or subModelType is enough.
 * Category / sector tokens are intentionally excluded.
 */
export function collaborationModelCompatible(
  needNorm: NormalizedPost,
  offerNorm: NormalizedPost,
): boolean {
  const needTokens = collaborationModelTokens(needNorm)
  const offerTokens = collaborationModelTokens(offerNorm)
  if (needTokens.size === 0 || offerTokens.size === 0) return true
  for (const token of needTokens) {
    if (offerTokens.has(token)) return true
  }
  return false
}

/**
 * Soft sector overlap. Empty categories are compatible.
 * Does not consider modelType / subModelType.
 */
export function categoryOverlap(needNorm: NormalizedPost, offerNorm: NormalizedPost): boolean {
  const needCat = sectorCategoryTokens(needNorm)
  const offerCat = sectorCategoryTokens(offerNorm)
  if (needCat.length === 0 || offerCat.length === 0) return true
  const offerSet = new Set(offerCat)
  return needCat.some((category) => offerSet.has(category))
}

export function getCandidates(
  needPost: OpportunityPost,
  offerPosts: readonly OpportunityPost[],
  config: MatchingConfig,
  options: CandidateGeneratorOptions = {},
): OpportunityPost[] {
  const maxCandidates = options.maxCandidates ?? config.CANDIDATE_MAX ?? 200
  const needNorm = options.needNormalized ?? needPost.normalized ?? {}
  const excludeCreatorId = needPost.creatorId

  const filtered = offerPosts.filter((offer) => {
    if (offer.creatorId === excludeCreatorId) return false
    if (offer.status !== 'published') return false
    const offerNorm = offer.normalized ?? {}
    if (!budgetCompatible(needNorm, offerNorm)) return false
    // Location is soft-scored via locationFit — never a hard reject.
    if (!timelineOverlap(needNorm, offerNorm)) return false
    if (!collaborationModelCompatible(needNorm, offerNorm)) return false
    const gate = passesPair(needPost, offer, config, { needNorm, offerNorm })
    if (!gate.ok) return false
    return true
  })

  const byCategory = (a: OpportunityPost, b: OpportunityPost): number => {
    const aCat = (a.normalized ?? {}).modelType ?? ''
    const bCat = (b.normalized ?? {}).modelType ?? ''
    if (aCat === (needNorm.modelType ?? '')) return -1
    if (bCat === (needNorm.modelType ?? '')) return 1
    return 0
  }
  filtered.sort(byCategory)
  return filtered.slice(0, maxCandidates)
}

export function getCandidatesForOffer(
  offerPost: OpportunityPost,
  needPosts: readonly OpportunityPost[],
  config: MatchingConfig,
  options: CandidateGeneratorOptions = {},
): OpportunityPost[] {
  const maxCandidates = options.maxCandidates ?? config.CANDIDATE_MAX ?? 200
  const offerNorm = options.offerNormalized ?? offerPost.normalized ?? {}
  const excludeCreatorId = offerPost.creatorId

  const filtered = needPosts.filter((need) => {
    if (need.creatorId === excludeCreatorId) return false
    if (need.status !== 'published') return false
    const needNorm = need.normalized ?? {}
    if (!budgetCompatible(needNorm, offerNorm)) return false
    // Location is soft-scored via locationFit — never a hard reject.
    if (!timelineOverlap(needNorm, offerNorm)) return false
    if (!collaborationModelCompatible(needNorm, offerNorm)) return false
    const gate = passesPair(need, offerPost, config, { needNorm, offerNorm })
    if (!gate.ok) return false
    return true
  })

  const byCategory = (a: OpportunityPost, b: OpportunityPost): number => {
    const aCat = (a.normalized ?? {}).modelType ?? ''
    const bCat = (b.normalized ?? {}).modelType ?? ''
    if (aCat === (offerNorm.modelType ?? '')) return -1
    if (bCat === (offerNorm.modelType ?? '')) return 1
    return 0
  }
  filtered.sort(byCategory)
  return filtered.slice(0, maxCandidates)
}

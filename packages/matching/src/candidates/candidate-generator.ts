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

export function locationCompatible(needNorm: NormalizedPost, offerNorm: NormalizedPost): boolean {
  const needLoc = (needNorm.location ?? '').toLowerCase()
  const offerLoc = (offerNorm.location ?? '').toLowerCase()
  if (needLoc === 'remote' || offerLoc === 'remote') return true
  if (needLoc === offerLoc) return true
  if (needLoc === 'ksa' && offerLoc) return true
  if (offerLoc === 'ksa' && needLoc) return true
  return false
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

export function categoryOverlap(needNorm: NormalizedPost, offerNorm: NormalizedPost): boolean {
  const needCat = new Set(
    [needNorm.modelType, needNorm.subModelType, ...(needNorm.categories ?? [])].filter(Boolean),
  )
  const offerCat = new Set(
    [offerNorm.modelType, offerNorm.subModelType, ...(offerNorm.categories ?? [])].filter(Boolean),
  )
  if (needCat.size === 0 && offerCat.size === 0) return true
  for (const category of needCat) {
    if (offerCat.has(category)) return true
  }
  return false
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
    if (!locationCompatible(needNorm, offerNorm)) return false
    if (!timelineOverlap(needNorm, offerNorm)) return false
    if (!categoryOverlap(needNorm, offerNorm)) return false
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
    if (!locationCompatible(needNorm, offerNorm)) return false
    if (!timelineOverlap(needNorm, offerNorm)) return false
    if (!categoryOverlap(needNorm, offerNorm)) return false
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

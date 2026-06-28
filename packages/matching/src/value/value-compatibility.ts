import type { OpportunityPost } from '../types/opportunity.ts'
import type { ValueExchangeNormalized } from '../types/opportunity.ts'

export function getNormalized(post: OpportunityPost): ValueExchangeNormalized {
  const ve = post.value_exchange ?? {}
  if (ve._normalized) return ve._normalized
  const totalOffered = ve.estimated_value != null ? Number(ve.estimated_value) : null
  const totalExpected = totalOffered
  return {
    totalOffered: totalOffered || 0,
    totalExpected: totalExpected || 0,
    riskAdjustedOffered: totalOffered || 0,
    riskAdjustedExpected: totalExpected || 0,
  }
}

export function exchangeCompatibility(postA: OpportunityPost, postB: OpportunityPost): number {
  const modeA = (postA.value_exchange?.mode) ?? postA.exchangeMode ?? ''
  const modeB = (postB.value_exchange?.mode) ?? postB.exchangeMode ?? ''
  const modesA = postA.value_exchange?.accepted_modes ?? (modeA ? [modeA] : [])
  const modesB = postB.value_exchange?.accepted_modes ?? (modeB ? [modeB] : [])
  const a = String(modeA).toLowerCase()
  const b = String(modeB).toLowerCase()
  const setA = Array.isArray(modesA) ? modesA.map((mode) => String(mode).toLowerCase()) : []
  const setB = Array.isArray(modesB) ? modesB.map((mode) => String(mode).toLowerCase()) : []

  if (a && b && a === b) return 1.0
  if (setB.includes(a) || setA.includes(b)) return 0.8
  const overlap = setA.filter((mode) => setB.includes(mode))
  if (overlap.length > 0) {
    return 0.5 + (0.3 * overlap.length / Math.max(setA.length, setB.length, 1))
  }
  return 0.0
}

export function valueCompatibility(needPost: OpportunityPost, offerPost: OpportunityPost): number {
  const normNeed = getNormalized(needPost)
  const normOffer = getNormalized(offerPost)
  const needExpected = normNeed.totalExpected || normNeed.riskAdjustedExpected
  const offerProvided = normOffer.totalOffered || normOffer.riskAdjustedOffered

  if (needExpected === 0 || offerProvided === 0) return 0.5
  const ratio = offerProvided / needExpected

  if (ratio >= 0.9 && ratio <= 1.1) return 1.0
  if (ratio >= 0.7 && ratio <= 1.3) return 0.8
  if (ratio >= 0.5 && ratio <= 1.5) return 0.6
  if (ratio >= 0.3 && ratio <= 2.0) return 0.3
  return 0.0
}

export interface OneWayValueFit {
  readonly valueFit: 'weak' | 'partial' | 'strong'
  readonly valueGap: number
  readonly valueGapPercent: number
  readonly coverageRatio: number
  readonly riskAdjustedRatio: number
}

export function oneWayValueFit(need: OpportunityPost, offer: OpportunityPost): OneWayValueFit {
  const n = getNormalized(need)
  const o = getNormalized(offer)
  const needVal = n.totalExpected || n.riskAdjustedExpected
  const offerVal = o.totalOffered || o.riskAdjustedOffered
  const gap = needVal > 0 ? offerVal - needVal : 0
  const ratio = needVal > 0 ? offerVal / needVal : 0
  const riskRatio = n.riskAdjustedExpected > 0 ? o.riskAdjustedOffered / n.riskAdjustedExpected : 0

  let valueFit: OneWayValueFit['valueFit'] = 'weak'
  if (ratio >= 0.8 && ratio <= 1.2) valueFit = 'strong'
  else if (ratio >= 0.5) valueFit = 'partial'

  return {
    valueFit,
    valueGap: gap,
    valueGapPercent: needVal > 0 ? (gap / needVal) * 100 : 0,
    coverageRatio: ratio,
    riskAdjustedRatio: riskRatio,
  }
}

export interface BarterValueEquivalence {
  readonly equivalenceScore: number
  readonly aCoversB: number
  readonly bCoversA: number
  readonly symmetry: number
  readonly gapA: number
  readonly gapB: number
  readonly suggestion: string
}

export function barterValueEquivalence(
  postA: OpportunityPost,
  postB: OpportunityPost,
): BarterValueEquivalence {
  const nA = getNormalized(postA)
  const nB = getNormalized(postB)
  const aOffersValue = nA.riskAdjustedOffered
  const bOffersValue = nB.riskAdjustedOffered
  const aExpectsValue = nA.riskAdjustedExpected || nA.totalExpected
  const bExpectsValue = nB.riskAdjustedExpected || nB.totalExpected

  const aExpects = aExpectsValue > 0 ? aExpectsValue : 1
  const bExpects = bExpectsValue > 0 ? bExpectsValue : 1
  const aCoversB = bExpects > 0 ? Math.min(aOffersValue / bExpects, 1.0) : 1
  const bCoversA = aExpects > 0 ? Math.min(bOffersValue / aExpects, 1.0) : 1
  const symmetry = Math.min(aCoversB, bCoversA) / Math.max(aCoversB, bCoversA, 0.001)
  const gapA = Math.max(aExpectsValue - bOffersValue, 0)
  const gapB = Math.max(bExpectsValue - aOffersValue, 0)
  const equivalenceScore = (symmetry + Math.min(aCoversB, bCoversA, 1.0)) / 2

  let suggestion = 'Balanced exchange'
  if (gapA > 0 || gapB > 0) {
    suggestion = `Cash adjustment needed: A pays ${Math.round(gapA)} SAR, B pays ${Math.round(gapB)} SAR`
  }

  return {
    equivalenceScore,
    aCoversB,
    bCoversA,
    symmetry,
    gapA,
    gapB,
    suggestion,
  }
}

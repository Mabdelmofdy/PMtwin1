import type { ExplainabilityAdapter } from './explainability-adapter.ts'
import {
  NEGOTIATION_ADAPTER_SCORE_WEIGHTS,
  NEGOTIATION_BREAKDOWN_LABELS,
  NEGOTIATION_RESPONSE_DELAY_DAYS_THRESHOLD,
  isLargePriceGap,
  isResponseDelayed,
  negotiationGapToReasonCode,
  negotiationStatusToHref,
  negotiationStatusToReasonCode,
  negotiationTermsFieldToHref,
} from './negotiation-field-map.ts'
import type {
  NegotiationExplainabilitySnapshot,
  NegotiationStatus,
} from './negotiation-types.ts'
import type { ReasonCode } from '../reason-codes/index.ts'
import { NEGOTIATION_REASON_CODES } from '../reason-codes/negotiation.ts'
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
  TIMELINE_EVENT_STATUS,
} from '../types/severity.ts'

export const NEGOTIATION_ADAPTER_VERSION = '1.0.0' as const

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function resolveGeneratedAt(input: NegotiationExplainabilitySnapshot): string {
  return input.evaluatedAt ?? new Date().toISOString()
}

function resolveOfferCount(input: NegotiationExplainabilitySnapshot): number {
  if (input.offerCount != null) return input.offerCount
  return input.currentOffer ? 1 : 0
}

function resolveCounterOfferCount(input: NegotiationExplainabilitySnapshot): number {
  if (input.counterOfferCount != null) return input.counterOfferCount
  if (input.status === 'countered') return 1
  return 0
}

function gapPenalty(input: NegotiationExplainabilitySnapshot): number {
  const gapCount = input.commercialTermsGaps?.length ?? 0
  return Math.min(20, gapCount * 4)
}

function priceGapPenalty(input: NegotiationExplainabilitySnapshot): number {
  const percent = input.priceGap?.percent
  if (percent == null) return 0
  return Math.min(25, percent / 2)
}

function delayPenalty(input: NegotiationExplainabilitySnapshot): number {
  const days = input.responseDelayDays
  if (days == null || days < NEGOTIATION_RESPONSE_DELAY_DAYS_THRESHOLD) return 0
  return Math.min(15, (days - 2) * 3)
}

/** Read-only heuristic for display — does not affect negotiation FSM. */
export function computeNegotiationProgressScore(
  input: NegotiationExplainabilitySnapshot,
): number {
  const offerCount = resolveOfferCount(input)
  const counterCount = resolveCounterOfferCount(input)

  switch (input.status) {
    case 'agreed':
      return 100
    case 'cancelled':
      return 10
    case 'expired':
      return 5
    case 'countered': {
      let score = 50 + Math.min(10, counterCount * 3)
      if (input.currentOffer) score += 5
      score -= gapPenalty(input)
      score -= priceGapPenalty(input)
      score -= delayPenalty(input)
      if (input.pendingCounterOffer) score -= 5
      return roundScore(clamp(score, 40, 60))
    }
    case 'active': {
      if (offerCount === 0) return 30
      let score = 55 + Math.min(15, offerCount * 5)
      if (input.pendingCounterOffer) score -= 5
      score -= gapPenalty(input)
      score -= priceGapPenalty(input)
      score -= delayPenalty(input)
      return roundScore(clamp(score, 50, 70))
    }
    default:
      return 0
  }
}

function resolveHealth(
  input: NegotiationExplainabilitySnapshot,
  scorePercent: number,
): (typeof HEALTH)[keyof typeof HEALTH] {
  if (input.status === 'agreed') return HEALTH.EXCELLENT
  if (input.status === 'expired' || input.status === 'cancelled') {
    return HEALTH.CRITICAL
  }
  if (input.status === 'active' && scorePercent >= 65) return HEALTH.GOOD
  if (input.status === 'countered' && scorePercent >= 55) return HEALTH.GOOD
  if (input.status === 'active' || input.status === 'countered') {
    return HEALTH.WARNING
  }
  return HEALTH.CRITICAL
}

function statusMessage(status: NegotiationStatus): string {
  switch (status) {
    case 'active':
      return 'Negotiation is active — offers may be submitted or reviewed.'
    case 'countered':
      return 'Negotiation has been countered — terms are under revision.'
    case 'agreed':
      return 'Negotiation agreed — commercial terms are accepted.'
    case 'expired':
      return 'Negotiation expired — no agreement was reached in time.'
    case 'cancelled':
      return 'Negotiation cancelled — parties did not proceed.'
    default:
      return `Negotiation status: ${status}`
  }
}

function buildSummary(
  input: NegotiationExplainabilitySnapshot,
  scorePercent: number,
): string {
  if (input.status === 'agreed') {
    return 'Negotiation agreed — terms accepted and ready for contracting.'
  }
  if (input.status === 'expired') {
    return 'Negotiation expired — respond or restart to continue.'
  }
  if (input.status === 'cancelled') {
    return 'Negotiation cancelled — no further offers can be accepted.'
  }
  if (input.changesRequested) {
    return 'Changes requested — resolve review feedback before proceeding.'
  }
  if (input.pendingCounterOffer) {
    return 'Counter-offer pending — review and respond to continue negotiation.'
  }
  if (resolveOfferCount(input) === 0) {
    return 'Negotiation active — submit an initial offer to begin.'
  }
  return `Negotiation progress ${Math.round(scorePercent)}% — ${statusMessage(input.status).toLowerCase()}`
}

function buildReasons(
  input: NegotiationExplainabilitySnapshot,
  scorePercent: number,
): readonly ExplanationReason[] {
  const reasons: ExplanationReason[] = [
    {
      code: NEGOTIATION_REASON_CODES.SCORE_SUMMARY,
      message: `Negotiation progress ${Math.round(scorePercent)}%`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: 'summary',
      relatedEntityId: input.entityId,
    },
    {
      code: negotiationStatusToReasonCode(input.status),
      message: statusMessage(input.status),
      severity:
        input.status === 'expired' || input.status === 'cancelled'
          ? EXPLANATION_SEVERITY.CRITICAL
          : input.status === 'agreed'
            ? EXPLANATION_SEVERITY.INFO
            : EXPLANATION_SEVERITY.WARNING,
      category: 'status',
      relatedEntityId: input.entityId,
    },
  ]

  if (resolveOfferCount(input) === 0 && input.status !== 'agreed') {
    reasons.push({
      code: NEGOTIATION_REASON_CODES.NO_OFFERS,
      message: 'No offers submitted yet.',
      severity: EXPLANATION_SEVERITY.WARNING,
      category: 'offers',
      relatedEntityId: input.entityId,
    })
  }

  if (input.currentOffer?.termsSummary) {
    reasons.push({
      code: NEGOTIATION_REASON_CODES.STATUS_ACTIVE,
      message: `Current offer: ${input.currentOffer.termsSummary}`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: 'offers',
      relatedEntityId: input.entityId,
    })
  }

  for (const gap of input.commercialTermsGaps ?? []) {
    reasons.push({
      code: negotiationGapToReasonCode(),
      message:
        gap.changeSummary ??
        `${gap.label}: ${gap.priorValue ?? '—'} → ${gap.proposedValue ?? '—'}`,
      severity: EXPLANATION_SEVERITY.WARNING,
      category: gap.field,
      relatedEntityId: input.entityId,
    })
  }

  if (input.priceGap?.percent != null || input.priceGap?.absolute != null) {
    const parts: string[] = []
    if (input.priceGap.percent != null) {
      parts.push(`${Math.round(input.priceGap.percent)}%`)
    }
    if (input.priceGap.absolute != null) {
      const currency = input.priceGap.currency ?? 'SAR'
      parts.push(`${input.priceGap.absolute} ${currency}`)
    }
    reasons.push({
      code: NEGOTIATION_REASON_CODES.PRICE_GAP,
      message: `Price gap: ${parts.join(' / ')}`,
      severity: isLargePriceGap(input.priceGap.percent)
        ? EXPLANATION_SEVERITY.CRITICAL
        : EXPLANATION_SEVERITY.WARNING,
      category: 'commercial',
      relatedEntityId: input.entityId,
    })
  }

  if (isResponseDelayed(input.responseDelayDays)) {
    reasons.push({
      code: NEGOTIATION_REASON_CODES.RESPONSE_DELAY,
      message: `Response delayed by ${input.responseDelayDays} day(s).`,
      severity: EXPLANATION_SEVERITY.WARNING,
      category: 'timeliness',
      relatedEntityId: input.entityId,
    })
  }

  if (input.pendingCounterOffer) {
    reasons.push({
      code: NEGOTIATION_REASON_CODES.COUNTER_PENDING,
      message: 'A counter-offer is awaiting response.',
      severity: EXPLANATION_SEVERITY.WARNING,
      category: 'offers',
      relatedEntityId: input.entityId,
    })
  }

  if (input.changesRequested) {
    reasons.push({
      code: NEGOTIATION_REASON_CODES.CHANGES_REQUESTED,
      message:
        input.reviewNotes ??
        `Changes requested${input.requestedItems?.length ? `: ${input.requestedItems.join(', ')}` : ''}.`,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      category: 'review',
      relatedEntityId: input.entityId,
    })
  }

  return reasons
}

function buildBlockers(
  input: NegotiationExplainabilitySnapshot,
): readonly BlockingFactor[] {
  const blockers: BlockingFactor[] = []

  if (input.changesRequested) {
    blockers.push({
      reasonCode: NEGOTIATION_REASON_CODES.CHANGES_REQUESTED,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint:
        input.reviewNotes ??
        'Resolve requested changes and resubmit terms.',
    })
  }

  if (input.status === 'expired') {
    blockers.push({
      reasonCode: NEGOTIATION_REASON_CODES.STATUS_EXPIRED,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: 'Restart negotiation or submit a new offer before the deadline.',
    })
  }

  if (input.status === 'cancelled') {
    blockers.push({
      reasonCode: NEGOTIATION_REASON_CODES.STATUS_CANCELLED,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: 'Negotiation was cancelled — initiate a new negotiation to proceed.',
    })
  }

  if (isLargePriceGap(input.priceGap?.percent)) {
    blockers.push({
      reasonCode: NEGOTIATION_REASON_CODES.PRICE_GAP,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: 'Close the price gap with a revised offer or accept adjusted terms.',
    })
  }

  return blockers
}

function buildStrengths(
  input: NegotiationExplainabilitySnapshot,
): readonly StrengthWeaknessEntry[] {
  const strengths: StrengthWeaknessEntry[] = []

  if (input.status === 'agreed') {
    strengths.push({
      code: NEGOTIATION_REASON_CODES.STATUS_AGREED,
      label: 'Negotiation agreed',
      impactPercent: 40,
    })
  }

  if (input.acceptedOffer) {
    strengths.push({
      code: NEGOTIATION_REASON_CODES.OFFER_ACCEPTED,
      label: input.acceptedOffer.termsSummary ?? 'Accepted offer on record',
      impactPercent: 35,
    })
  }

  const gapCount = input.commercialTermsGaps?.length ?? 0
  if (resolveOfferCount(input) > 0 && gapCount === 0 && input.status !== 'expired') {
    strengths.push({
      code: NEGOTIATION_REASON_CODES.STATUS_ACTIVE,
      label: 'Commercial terms aligned',
      impactPercent: 25,
    })
  }

  if (
    input.responseDelayDays != null
    && input.responseDelayDays < NEGOTIATION_RESPONSE_DELAY_DAYS_THRESHOLD
    && (input.status === 'active' || input.status === 'countered')
  ) {
    strengths.push({
      code: NEGOTIATION_REASON_CODES.STATUS_ACTIVE,
      label: 'Timely responses',
      impactPercent: 10,
    })
  }

  return strengths
}

function buildWeaknesses(
  input: NegotiationExplainabilitySnapshot,
): readonly StrengthWeaknessEntry[] {
  const weaknesses: StrengthWeaknessEntry[] = []

  for (const gap of input.commercialTermsGaps ?? []) {
    weaknesses.push({
      code: negotiationGapToReasonCode(),
      label: gap.label,
      impactPercent: roundScore(
        NEGOTIATION_ADAPTER_SCORE_WEIGHTS.termsAlignment /
          Math.max(1, input.commercialTermsGaps?.length ?? 1),
      ),
    })
  }

  if (input.priceGap?.percent != null || input.priceGap?.absolute != null) {
    weaknesses.push({
      code: NEGOTIATION_REASON_CODES.PRICE_GAP,
      label: 'Price gap between parties',
      impactPercent: NEGOTIATION_ADAPTER_SCORE_WEIGHTS.priceAlignment,
    })
  }

  if (isResponseDelayed(input.responseDelayDays)) {
    weaknesses.push({
      code: NEGOTIATION_REASON_CODES.RESPONSE_DELAY,
      label: `Response delayed (${input.responseDelayDays} days)`,
      impactPercent: NEGOTIATION_ADAPTER_SCORE_WEIGHTS.responseTimeliness,
    })
  }

  if (input.pendingCounterOffer) {
    weaknesses.push({
      code: NEGOTIATION_REASON_CODES.COUNTER_PENDING,
      label: 'Counter-offer awaiting response',
      impactPercent: 15,
    })
  }

  if (resolveOfferCount(input) === 0 && input.status === 'active') {
    weaknesses.push({
      code: NEGOTIATION_REASON_CODES.NO_OFFERS,
      label: 'No offers submitted',
      impactPercent: NEGOTIATION_ADAPTER_SCORE_WEIGHTS.offerProgression,
    })
  }

  return weaknesses
}

function dimensionScore(
  input: NegotiationExplainabilitySnapshot,
  dimension: keyof typeof NEGOTIATION_ADAPTER_SCORE_WEIGHTS,
): number {
  const weight = NEGOTIATION_ADAPTER_SCORE_WEIGHTS[dimension]

  switch (dimension) {
    case 'priceAlignment': {
      const percent = input.priceGap?.percent
      if (percent == null) return weight
      const alignment = clamp(1 - percent / 100, 0, 1)
      return roundScore(alignment * weight)
    }
    case 'termsAlignment': {
      const gapCount = input.commercialTermsGaps?.length ?? 0
      if (gapCount === 0) return weight
      const alignment = clamp(1 - gapCount * 0.2, 0, 1)
      return roundScore(alignment * weight)
    }
    case 'responseTimeliness': {
      const days = input.responseDelayDays ?? 0
      if (days < NEGOTIATION_RESPONSE_DELAY_DAYS_THRESHOLD) return weight
      const alignment = clamp(1 - (days - 2) * 0.1, 0, 1)
      return roundScore(alignment * weight)
    }
    case 'offerProgression': {
      if (input.status === 'agreed') return weight
      const offers = resolveOfferCount(input)
      const counters = resolveCounterOfferCount(input)
      if (offers === 0) return 0
      const progression = clamp((offers + counters * 0.5) / 4, 0, 1)
      return roundScore(progression * weight)
    }
    default:
      return 0
  }
}

function buildRecommendationsFromSnapshot(
  input: NegotiationExplainabilitySnapshot,
): readonly Recommendation[] {
  const recommendations: Recommendation[] = []
  const currentScore = computeNegotiationProgressScore(input)
  let index = 0

  if (input.pendingCounterOffer || input.status === 'countered') {
    recommendations.push({
      id: `negotiation-rec-counter-${index}`,
      label: 'Review and respond to the counter-offer',
      reasonCode: NEGOTIATION_REASON_CODES.COUNTER_PENDING,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: 25,
      estimatedScore: roundScore(Math.min(100, currentScore + 15)),
      href: negotiationStatusToHref(input.entityId, 'offers'),
      category: 'offers',
      severity: EXPLANATION_SEVERITY.WARNING,
    })
    index += 1
  }

  if (
    input.currentOffer
    && input.status !== 'agreed'
    && input.status !== 'expired'
    && input.status !== 'cancelled'
    && !input.pendingCounterOffer
  ) {
    recommendations.push({
      id: `negotiation-rec-accept-${index}`,
      label: 'Accept the current offer to proceed',
      reasonCode: NEGOTIATION_REASON_CODES.OFFER_ACCEPTED,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: 40,
      estimatedScore: 100,
      href: negotiationStatusToHref(input.entityId, 'offers'),
      category: 'offers',
      severity: EXPLANATION_SEVERITY.INFO,
    })
    index += 1
  }

  if (input.changesRequested) {
    recommendations.push({
      id: `negotiation-rec-changes-${index}`,
      label: 'Resolve requested changes and resubmit',
      reasonCode: NEGOTIATION_REASON_CODES.CHANGES_REQUESTED,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: 30,
      estimatedScore: roundScore(Math.min(100, currentScore + 20)),
      href: negotiationStatusToHref(input.entityId, 'terms'),
      category: 'review',
      severity: EXPLANATION_SEVERITY.CRITICAL,
    })
    index += 1
  }

  if (isResponseDelayed(input.responseDelayDays)) {
    recommendations.push({
      id: `negotiation-rec-delay-${index}`,
      label: 'Respond to pending negotiation items',
      reasonCode: NEGOTIATION_REASON_CODES.RESPONSE_DELAY,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: 20,
      estimatedScore: roundScore(Math.min(100, currentScore + 10)),
      href: negotiationStatusToHref(input.entityId, 'messages'),
      category: 'timeliness',
      severity: EXPLANATION_SEVERITY.WARNING,
    })
    index += 1
  }

  if (isLargePriceGap(input.priceGap?.percent)) {
    recommendations.push({
      id: `negotiation-rec-price-${index}`,
      label: 'Submit a revised offer to close the price gap',
      reasonCode: NEGOTIATION_REASON_CODES.PRICE_GAP,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: NEGOTIATION_ADAPTER_SCORE_WEIGHTS.priceAlignment,
      estimatedScore: roundScore(Math.min(100, currentScore + 20)),
      href: negotiationStatusToHref(input.entityId, 'offers'),
      category: 'commercial',
      severity: EXPLANATION_SEVERITY.WARNING,
    })
    index += 1
  }

  for (const gap of input.commercialTermsGaps ?? []) {
    recommendations.push({
      id: `negotiation-rec-term-${gap.field}-${index}`,
      label: `Align ${gap.label.toLowerCase()} terms`,
      reasonCode: negotiationGapToReasonCode(),
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: roundScore(
        NEGOTIATION_ADAPTER_SCORE_WEIGHTS.termsAlignment /
          Math.max(1, input.commercialTermsGaps?.length ?? 1),
      ),
      estimatedScore: roundScore(Math.min(100, currentScore + 8)),
      href: negotiationTermsFieldToHref(input.entityId, gap.field),
      category: gap.field,
      severity: EXPLANATION_SEVERITY.WARNING,
    })
    index += 1
  }

  if (
    resolveOfferCount(input) === 0
    && input.status === 'active'
    && !input.changesRequested
  ) {
    recommendations.push({
      id: `negotiation-rec-submit-${index}`,
      label: 'Submit an initial offer',
      reasonCode: NEGOTIATION_REASON_CODES.NO_OFFERS,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: NEGOTIATION_ADAPTER_SCORE_WEIGHTS.offerProgression,
      estimatedScore: 55,
      href: negotiationStatusToHref(input.entityId, 'offers'),
      category: 'offers',
      severity: EXPLANATION_SEVERITY.WARNING,
    })
  }

  return recommendations
}

function buildBreakdownFromSnapshot(
  input: NegotiationExplainabilitySnapshot,
): readonly ScoreBreakdownEntry[] {
  return (
    Object.keys(NEGOTIATION_ADAPTER_SCORE_WEIGHTS) as Array<
      keyof typeof NEGOTIATION_ADAPTER_SCORE_WEIGHTS
    >
  ).map((dimension) => {
    const weight = NEGOTIATION_ADAPTER_SCORE_WEIGHTS[dimension]
    const score = dimensionScore(input, dimension)
    const reasonCodes: ReasonCode[] = []

    if (dimension === 'priceAlignment' && input.priceGap) {
      reasonCodes.push(NEGOTIATION_REASON_CODES.PRICE_GAP)
    }
    if (dimension === 'termsAlignment' && (input.commercialTermsGaps?.length ?? 0) > 0) {
      reasonCodes.push(NEGOTIATION_REASON_CODES.TERMS_MISMATCH)
    }
    if (dimension === 'responseTimeliness' && isResponseDelayed(input.responseDelayDays)) {
      reasonCodes.push(NEGOTIATION_REASON_CODES.RESPONSE_DELAY)
    }
    if (dimension === 'offerProgression' && resolveOfferCount(input) === 0) {
      reasonCodes.push(NEGOTIATION_REASON_CODES.NO_OFFERS)
    }

    return {
      label: NEGOTIATION_BREAKDOWN_LABELS[dimension],
      weight,
      score,
      maxScore: weight,
      reasonCodes,
    }
  })
}

function mapTimelineStatus(
  status: string | undefined,
): (typeof TIMELINE_EVENT_STATUS)[keyof typeof TIMELINE_EVENT_STATUS] {
  if (status === 'blocked' || status === 'failed') {
    return TIMELINE_EVENT_STATUS.BLOCKED
  }
  if (status === 'pending') {
    return TIMELINE_EVENT_STATUS.PENDING
  }
  if (status === 'in_progress' || status === 'active') {
    return TIMELINE_EVENT_STATUS.ACTIVE
  }
  return TIMELINE_EVENT_STATUS.COMPLETED
}

function buildTimelineFromSnapshot(
  input: NegotiationExplainabilitySnapshot,
): readonly TimelineEvent[] {
  if (input.timelineEvents && input.timelineEvents.length > 0) {
    return input.timelineEvents.map((event) => ({
      type: event.type,
      title: event.title,
      description: event.description,
      timestamp: event.timestamp,
      status: mapTimelineStatus(event.status),
      relatedEntity: input.entityId,
    }))
  }

  const events: TimelineEvent[] = []
  const evaluatedAt = resolveGeneratedAt(input)

  if (input.currentOffer?.submittedAt) {
    events.push({
      type: 'offer-submitted',
      title: 'Offer submitted',
      description:
        input.currentOffer.termsSummary ??
        `Offer submitted${input.currentOffer.submittedBy ? ` by ${input.currentOffer.submittedBy}` : ''}.`,
      timestamp: input.currentOffer.submittedAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId,
    })
  }

  if (resolveCounterOfferCount(input) > 0 || input.status === 'countered') {
    events.push({
      type: 'counter-offered',
      title: 'Counter-offer submitted',
      description: input.pendingCounterOffer
        ? 'Counter-offer awaiting response.'
        : 'Parties exchanged counter-offers.',
      timestamp: input.currentOffer?.submittedAt ?? evaluatedAt,
      status: input.pendingCounterOffer
        ? TIMELINE_EVENT_STATUS.PENDING
        : TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId,
    })
  }

  if (input.status === 'agreed' || input.acceptedOffer) {
    events.push({
      type: 'negotiation-agreed',
      title: 'Negotiation agreed',
      description:
        input.acceptedOffer?.termsSummary ?? 'Commercial terms accepted by both parties.',
      timestamp: input.acceptedOffer?.submittedAt ?? evaluatedAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId,
    })
  }

  if (input.status === 'expired') {
    events.push({
      type: 'negotiation-expired',
      title: 'Negotiation expired',
      description: 'Negotiation window closed without agreement.',
      timestamp: evaluatedAt,
      status: TIMELINE_EVENT_STATUS.BLOCKED,
      relatedEntity: input.entityId,
    })
  }

  if (input.status === 'cancelled') {
    events.push({
      type: 'negotiation-cancelled',
      title: 'Negotiation cancelled',
      description: 'Negotiation was cancelled by a participant.',
      timestamp: evaluatedAt,
      status: TIMELINE_EVENT_STATUS.BLOCKED,
      relatedEntity: input.entityId,
    })
  }

  if (events.length === 0) {
    events.push({
      type: 'negotiation-active',
      title: 'Negotiation opened',
      description: statusMessage(input.status),
      timestamp: evaluatedAt,
      status: TIMELINE_EVENT_STATUS.ACTIVE,
      relatedEntity: input.entityId,
    })
  }

  return events
}

export function buildNegotiationExplanation(
  input: NegotiationExplainabilitySnapshot,
): ExplanationBundle {
  const scorePercent = computeNegotiationProgressScore(input)
  const generatedAt = resolveGeneratedAt(input)

  return {
    engine: ENGINE_ID.NEGOTIATION,
    entityId: input.entityId,
    score: scorePercent,
    health: resolveHealth(input, scorePercent),
    summary: buildSummary(input, scorePercent),
    scoreBreakdown: buildBreakdownFromSnapshot(input),
    reasons: buildReasons(input, scorePercent),
    blockers: buildBlockers(input),
    strengths: buildStrengths(input),
    weaknesses: buildWeaknesses(input),
    recommendations: buildRecommendationsFromSnapshot(input),
    timeline: buildTimelineFromSnapshot(input),
    metadata: {
      generatedAt,
      engineVersion: NEGOTIATION_ADAPTER_VERSION,
      locale: input.locale ?? 'en-SA',
      source: 'negotiation-adapter',
      tags: [input.status],
      extensions: {
        offerCount: resolveOfferCount(input),
        counterOfferCount: resolveCounterOfferCount(input),
        status: input.status,
        pendingCounterOffer: input.pendingCounterOffer ?? false,
        changesRequested: input.changesRequested ?? false,
      },
    },
  }
}

export const negotiationExplainabilityAdapter: ExplainabilityAdapter<NegotiationExplainabilitySnapshot> =
  {
    buildExplanation: buildNegotiationExplanation,
    buildRecommendations: buildRecommendationsFromSnapshot,
    buildBreakdown: buildBreakdownFromSnapshot,
    buildTimeline: buildTimelineFromSnapshot,
  }

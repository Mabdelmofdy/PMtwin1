/**
 * Collaboration model catalog — delegates to @pm-twin/collaboration-models registry.
 */
import {
  listMainCollaborationModels,
  type MainCollaborationModel,
} from '@pm-twin/collaboration-models'

export type CollaborationModelId = MainCollaborationModel

export type CollaborationModelRecommendation = {
  id: CollaborationModelId
  title: string
  score: number
  reason: string
}

export const COLLABORATION_MODEL_CATALOG = Object.fromEntries(
  listMainCollaborationModels().map((model) => [
    model.key,
    { title: model.name, summary: model.description },
  ]),
) as Record<CollaborationModelId, { title: string; summary: string }>

export type WizardExchangePreference = 'cash' | 'barter' | 'partnership' | 'pooling' | 'hiring'
export type WizardEngagementScope = 'defined_package' | 'swap' | 'multi_party' | 'capacity' | 'role'
export type WizardPriority = 'payment_clarity' | 'liquidity' | 'governance' | 'utilization' | 'talent'

export type CollaborationWizardAnswers = {
  exchangePreference: WizardExchangePreference | ''
  engagementScope: WizardEngagementScope | ''
  priority: WizardPriority | ''
}

const EXCHANGE_SCORES: Record<WizardExchangePreference, Partial<Record<CollaborationModelId, number>>> = {
  cash: { cash_subcontracting: 3 },
  barter: { service_exchange: 3 },
  partnership: { joint_venture: 3 },
  pooling: { resource_sharing: 3 },
  hiring: { hiring: 3 },
}

const SCOPE_SCORES: Record<WizardEngagementScope, Partial<Record<CollaborationModelId, number>>> = {
  defined_package: { cash_subcontracting: 2 },
  swap: { service_exchange: 2 },
  multi_party: { joint_venture: 2 },
  capacity: { resource_sharing: 2 },
  role: { hiring: 2 },
}

const PRIORITY_SCORES: Record<WizardPriority, Partial<Record<CollaborationModelId, number>>> = {
  payment_clarity: { cash_subcontracting: 2 },
  liquidity: { service_exchange: 2 },
  governance: { joint_venture: 2 },
  utilization: { resource_sharing: 2 },
  talent: { hiring: 2 },
}

const REASONS: Record<CollaborationModelId, string> = {
  cash_subcontracting:
    'Fits when scope and deliverables are clear and cash payment is the primary exchange.',
  service_exchange:
    'Fits when complementary capabilities can be traded without immediate cash outlay.',
  joint_venture:
    'Fits when partners need shared governance and co-delivery on a joint objective.',
  resource_sharing:
    'Fits when the main gain is better utilization of equipment, teams, or pooled procurement.',
  hiring:
    'Fits when you need to engage a professional or consultant for a defined role or deliverable.',
}

function addScores(
  totals: Record<CollaborationModelId, number>,
  partial: Partial<Record<CollaborationModelId, number>>,
) {
  for (const [id, value] of Object.entries(partial) as [CollaborationModelId, number][]) {
    totals[id] += value
  }
}

/** Transparent rule-based recommendations — not AI. */
export function recommendCollaborationModels(
  answers: CollaborationWizardAnswers,
): CollaborationModelRecommendation[] {
  const totals: Record<CollaborationModelId, number> = {
    cash_subcontracting: 0,
    service_exchange: 0,
    joint_venture: 0,
    resource_sharing: 0,
    hiring: 0,
  }

  if (answers.exchangePreference) {
    addScores(totals, EXCHANGE_SCORES[answers.exchangePreference])
  }
  if (answers.engagementScope) {
    addScores(totals, SCOPE_SCORES[answers.engagementScope])
  }
  if (answers.priority) {
    addScores(totals, PRIORITY_SCORES[answers.priority])
  }

  const maxScore = Math.max(...Object.values(totals))
  if (maxScore === 0) return []

  return (Object.keys(totals) as CollaborationModelId[])
    .map((id) => ({
      id,
      title: COLLABORATION_MODEL_CATALOG[id].title,
      score: totals[id],
      reason: REASONS[id],
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
}

export function isWizardComplete(answers: CollaborationWizardAnswers): boolean {
  return Boolean(answers.exchangePreference && answers.engagementScope && answers.priority)
}

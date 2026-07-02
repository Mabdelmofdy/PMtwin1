/** Public collaboration model identifiers — marketing wizard only. */
export type CollaborationModelId =
  | 'cash_subcontracting'
  | 'service_exchange'
  | 'joint_venture'
  | 'resource_sharing'

export type CollaborationModelRecommendation = {
  id: CollaborationModelId
  title: string
  score: number
  reason: string
}

export const COLLABORATION_MODEL_CATALOG: Record<
  CollaborationModelId,
  { title: string; summary: string }
> = {
  cash_subcontracting: {
    title: 'Cash Subcontracting',
    summary: 'Paid delivery for a defined scope with clear payment milestones.',
  },
  service_exchange: {
    title: 'Service Exchange / Barter',
    summary: 'Trade services or resources of comparable value instead of cash.',
  },
  joint_venture: {
    title: 'Joint Venture',
    summary: 'Shared delivery, governance, and outcomes across partners.',
  },
  resource_sharing: {
    title: 'Resource Sharing',
    summary: 'Pool equipment, teams, or procurement capacity across projects.',
  },
}

export type WizardExchangePreference = 'cash' | 'barter' | 'partnership' | 'pooling'
export type WizardEngagementScope = 'defined_package' | 'swap' | 'multi_party' | 'capacity'
export type WizardPriority = 'payment_clarity' | 'liquidity' | 'governance' | 'utilization'

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
}

const SCOPE_SCORES: Record<WizardEngagementScope, Partial<Record<CollaborationModelId, number>>> = {
  defined_package: { cash_subcontracting: 2 },
  swap: { service_exchange: 2 },
  multi_party: { joint_venture: 2 },
  capacity: { resource_sharing: 2 },
}

const PRIORITY_SCORES: Record<WizardPriority, Partial<Record<CollaborationModelId, number>>> = {
  payment_clarity: { cash_subcontracting: 2 },
  liquidity: { service_exchange: 2 },
  governance: { joint_venture: 2 },
  utilization: { resource_sharing: 2 },
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

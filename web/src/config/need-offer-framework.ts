/** Authoritative Need/Offer framework vocabulary — mirrors PMTwin Need/Offer Framework PDF. */

export type PostTypeKey = 'need' | 'offer'

export type MatchingModelKey = 'one_way' | 'two_way' | 'consortium' | 'circular'

export type ValueExchangeModeKey =
  | 'cash'
  | 'equity'
  | 'profit_sharing'
  | 'barter'
  | 'hybrid'

export type SemanticMirrorPair = {
  readonly needLabel: string
  readonly offerLabel: string
  readonly needField: string
  readonly offerField: string
}

export type MatchingModelDefinition = {
  readonly key: MatchingModelKey
  readonly label: string
  readonly subtitle: string
  readonly description: string
}

export type ValueExchangeModeDefinition = {
  readonly key: ValueExchangeModeKey
  readonly label: string
  readonly description: string
}

export type UserJourneyStep = {
  readonly id: string
  readonly label: string
}

export const POST_TYPE_LABELS: Record<PostTypeKey, string> = {
  need: 'Need',
  offer: 'Offer',
}

export const SEMANTIC_MIRROR_PAIRS: readonly SemanticMirrorPair[] = [
  {
    needLabel: 'Required Skills',
    offerLabel: 'Available Skills',
    needField: 'requiredSkills',
    offerField: 'availableSkills',
  },
  {
    needLabel: 'Budget',
    offerLabel: 'Rate',
    needField: 'budget',
    offerField: 'rate',
  },
  {
    needLabel: 'Deadline',
    offerLabel: 'Availability',
    needField: 'deadline',
    offerField: 'availability',
  },
  {
    needLabel: 'Location',
    offerLabel: 'Preferred Location',
    needField: 'location',
    offerField: 'preferredLocation',
  },
]

export const MATCHING_MODELS: Record<MatchingModelKey, MatchingModelDefinition> = {
  one_way: {
    key: 'one_way',
    label: 'One Way Matching',
    subtitle: 'Simple Matching',
    description: 'A published Need is matched to compatible Offers (or an Offer to Needs).',
  },
  two_way: {
    key: 'two_way',
    label: 'Two-Way Dependency',
    subtitle: 'Barter',
    description: 'Each party contributes both a Need and an Offer — reciprocal exchange.',
  },
  consortium: {
    key: 'consortium',
    label: 'Group Formation',
    subtitle: 'Consortium',
    description: 'A lead Need is fulfilled by multiple partner Offers across defined roles.',
  },
  circular: {
    key: 'circular',
    label: 'Circular Exchange',
    subtitle: 'Multi-party ring',
    description: 'Three or more parties form a closed exchange ring (A → B → C → A).',
  },
}

export const MATCHING_MODEL_KEYS: readonly MatchingModelKey[] = [
  'one_way',
  'two_way',
  'consortium',
  'circular',
]

export const VALUE_EXCHANGE_MODES: readonly ValueExchangeModeDefinition[] = [
  {
    key: 'cash',
    label: 'Cash',
    description: 'Monetary payment for services or deliverables.',
  },
  {
    key: 'equity',
    label: 'Equity',
    description: 'Ownership stake or equity participation.',
  },
  {
    key: 'profit_sharing',
    label: 'Profit-Sharing',
    description: 'Revenue or profit split based on agreed terms.',
  },
  {
    key: 'barter',
    label: 'Barter',
    description: 'Non-cash exchange of services, capacity, or resources.',
  },
  {
    key: 'hybrid',
    label: 'Hybrid',
    description: 'Combination of cash and non-cash value exchange modes.',
  },
]

export const USER_JOURNEY_STEPS: readonly UserJourneyStep[] = [
  { id: 'auth', label: 'Sign Up / Sign In' },
  { id: 'post', label: 'Post Need or Offer' },
  { id: 'model', label: 'Select Model' },
  { id: 'submodel', label: 'Select Sub-model' },
  { id: 'attributes', label: 'Describe Attributes' },
  { id: 'matching', label: 'Matching' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'agreement', label: 'Agreement / Contract' },
  { id: 'followup', label: 'Follow-up & Reviews' },
]

export function resolveMatchingModelKey(matchType?: string): MatchingModelKey {
  const key = (matchType ?? 'one_way').toLowerCase() as MatchingModelKey
  return MATCHING_MODEL_KEYS.includes(key) ? key : 'one_way'
}

export function formatFrameworkMatchTypeLabel(matchType?: string): string {
  return MATCHING_MODELS[resolveMatchingModelKey(matchType)].label
}

export function formatFrameworkMatchTypeSubtitle(matchType?: string): string {
  return MATCHING_MODELS[resolveMatchingModelKey(matchType)].subtitle
}

export function formatValueExchangeModeLabel(mode: string): string {
  const normalized = mode.toLowerCase().replace(/-/g, '_')
  const found = VALUE_EXCHANGE_MODES.find((entry) => entry.key === normalized)
  if (found) return found.label
  return mode.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function resolvePostTypeKey(intent?: string): PostTypeKey | 'hybrid' | 'unknown' {
  if (intent === 'offer') return 'offer'
  if (intent === 'need' || intent === 'request') return 'need'
  if (intent === 'hybrid') return 'hybrid'
  return 'unknown'
}

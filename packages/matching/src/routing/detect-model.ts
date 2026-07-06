import type { OpportunityPost } from '../types/opportunity.ts'
import type { MatchingModelName } from '../types/match-result.ts'
import {
  deriveMatchingTopology,
  normalizeSubModelType,
} from '@pm-twin/collaboration-models'

function mapIntent(intent?: string): string {
  if (intent === 'request') return 'need'
  return intent ?? 'need'
}

export function detectMatchingModel(opportunity: OpportunityPost): MatchingModelName[] {
  const intent = mapIntent(opportunity.intent)
  const hasNeed = intent === 'need' || intent === 'request' || intent === 'hybrid'
  const hasOffer = intent === 'offer' || intent === 'hybrid'
  const acceptedModes = opportunity.value_exchange?.accepted_modes ?? []
  const isBarter = (opportunity.exchangeMode ?? '').toLowerCase() === 'barter'
    || acceptedModes.some((mode) => String(mode).toLowerCase() === 'barter')
  const memberRoles = opportunity.attributes?.memberRoles
  const partnerRoles = opportunity.attributes?.partnerRoles
  const hasRoles = (Array.isArray(memberRoles) && memberRoles.length > 0)
    || (Array.isArray(partnerRoles) && partnerRoles.length > 0)
  const subModelType = normalizeSubModelType(opportunity.subModelType, {
    modelType: opportunity.modelType,
  })

  const derived = deriveMatchingTopology({
    mainCollaborationModel: (opportunity as { mainCollaborationModel?: string }).mainCollaborationModel,
    modelType: opportunity.modelType,
    subModelType: subModelType ?? opportunity.subModelType,
    exchangeMode: opportunity.exchangeMode,
    acceptedExchangeModes: acceptedModes.map(String),
    collaborationAttributes: opportunity.attributes,
    intent,
  })

  const modelList: MatchingModelName[] = []
  const preferred = (opportunity as { preferredMatchingTopology?: string }).preferredMatchingTopology
    ?? derived.topology

  if (preferred) modelList.push(preferred as MatchingModelName)
  if ((hasNeed || hasOffer) && !modelList.includes('one_way')) modelList.push('one_way')
  if (isBarter && (hasNeed || hasOffer) && !modelList.includes('two_way')) modelList.push('two_way')
  if ((hasRoles || subModelType === 'consortium') && !modelList.includes('consortium')) {
    modelList.push('consortium')
  }
  if (subModelType === 'resource_sharing' || subModelType === 'equipment_sharing') {
    if (!modelList.includes('circular')) modelList.push('circular')
  }

  return modelList.length > 0 ? modelList : ['one_way']
}

import type { MatchingModelName } from '../types/match-result.ts'
import type { OpportunityPost } from '../types/opportunity.ts'

export function detectMatchingModel(opportunity: OpportunityPost): MatchingModelName[] {
  const intent = opportunity.intent ?? 'request'
  const hasNeed = intent === 'request' || intent === 'hybrid'
  const hasOffer = intent === 'offer' || intent === 'hybrid'
  const acceptedModes = opportunity.value_exchange?.accepted_modes ?? []
  const isBarter = (opportunity.exchangeMode ?? '').toLowerCase() === 'barter'
    || acceptedModes.some((mode) => String(mode).toLowerCase() === 'barter')
  const memberRoles = opportunity.attributes?.memberRoles
  const partnerRoles = opportunity.attributes?.partnerRoles
  const hasRoles = (Array.isArray(memberRoles) && memberRoles.length > 0)
    || (Array.isArray(partnerRoles) && partnerRoles.length > 0)
  const subModelType = (opportunity.subModelType ?? '').toLowerCase()

  const modelList: MatchingModelName[] = []
  if (hasNeed || hasOffer) modelList.push('one_way')
  if (isBarter && (hasNeed || hasOffer)) modelList.push('two_way')
  if (hasRoles || subModelType === 'consortium') modelList.push('consortium')
  return modelList
}

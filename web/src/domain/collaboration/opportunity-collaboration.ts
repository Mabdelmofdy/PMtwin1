import type { Opportunity } from '@/types/domain.ts'
import {
  deriveMatchingTopology,
  getSubModel,
  inferMainCollaborationModel,
  isMatchTopologyValue,
  listSubModelsForMain,
  normalizeSubModelType,
  validateOpportunityCollaborationModel,
  type CollaborationTaxonomyInput,
} from '@pm-twin/collaboration-models'

export {
  deriveMatchingTopology,
  getSubModel,
  inferMainCollaborationModel,
  isMatchTopologyValue,
  listMainCollaborationModels,
  listSubModelsForMain,
  normalizeSubModelType,
  resolveMainCollaborationModelLabel,
  resolveModelTypeLabel,
  resolveSubModelLabel,
  validateOpportunityCollaborationModel,
} from '@pm-twin/collaboration-models'

export function opportunityToCollaborationInput(
  opportunity: Opportunity,
): CollaborationTaxonomyInput {
  return {
    mainCollaborationModel: opportunity.mainCollaborationModel,
    modelType: opportunity.modelType,
    subModelType: opportunity.subModelType,
    exchangeMode: opportunity.exchangeMode,
    acceptedExchangeModes: opportunity.acceptedExchangeModes ?? opportunity.paymentModes,
    collaborationAttributes: opportunity.collaborationAttributes ?? opportunity.attributes,
    intent: opportunity.intent,
  }
}

export function normalizeOpportunityCollaboration(
  raw: Opportunity,
): Opportunity {
  const subModelType = normalizeSubModelType(raw.subModelType, {
    modelType: raw.modelType,
    mainCollaborationModel: raw.mainCollaborationModel,
  })
  const subDef = subModelType ? getSubModel(subModelType) : undefined
  const mainCollaborationModel =
    raw.mainCollaborationModel
    ?? subDef?.mainCollaborationModel
    ?? inferMainCollaborationModel({
      modelType: raw.modelType,
      subModelType: subModelType ?? raw.subModelType,
    })
  const modelType = subDef?.modelType ?? raw.modelType
  const derived = deriveMatchingTopology({
    mainCollaborationModel,
    modelType,
    subModelType: subModelType ?? raw.subModelType,
    exchangeMode: raw.exchangeMode,
    acceptedExchangeModes: raw.acceptedExchangeModes ?? raw.paymentModes,
    collaborationAttributes: raw.collaborationAttributes ?? raw.attributes,
    intent: raw.intent,
  })

  const allowedModes = subDef?.allowedExchangeModes ?? []
  let exchangeMode = raw.exchangeMode
  if (exchangeMode && allowedModes.length > 0 && !allowedModes.includes(exchangeMode as never)) {
    exchangeMode = allowedModes[0]
  }
  const acceptedExchangeModes =
    raw.acceptedExchangeModes
    ?? raw.paymentModes
    ?? (exchangeMode ? [exchangeMode] : undefined)

  return {
    ...raw,
    mainCollaborationModel,
    modelType,
    subModelType,
    exchangeMode,
    acceptedExchangeModes,
    paymentModes: acceptedExchangeModes,
    preferredMatchingTopology:
      raw.preferredMatchingTopology
      ?? (isMatchTopologyValue(raw.subModelType) ? raw.subModelType : derived.topology),
  }
}

export function normalizeOpportunities(items: Opportunity[]): Opportunity[] {
  return items.map(normalizeOpportunityCollaboration)
}

export function buildOpportunityCollaborationPatch(input: {
  readonly mainCollaborationModel: string
  readonly modelType: string
  readonly subModelType: string
  readonly exchangeMode: string
  readonly acceptedExchangeModes?: readonly string[]
  readonly collaborationAttributes?: Readonly<Record<string, unknown>>
  readonly preferredMatchingTopology?: string
}): Partial<Opportunity> {
  const normalizedSub = normalizeSubModelType(input.subModelType, input)
  const subModelType = normalizedSub
    ?? (isMatchTopologyValue(input.subModelType)
      ? listSubModelsForMain(input.mainCollaborationModel)[0]?.key
      : input.subModelType)
    ?? 'task_based'
  const subDef = getSubModel(subModelType)
  const derived = deriveMatchingTopology({
    ...input,
    modelType: subDef?.modelType ?? input.modelType,
    mainCollaborationModel: subDef?.mainCollaborationModel ?? input.mainCollaborationModel,
    subModelType,
  })

  return {
    mainCollaborationModel: subDef?.mainCollaborationModel ?? input.mainCollaborationModel,
    modelType: subDef?.modelType ?? input.modelType,
    subModelType,
    exchangeMode: input.exchangeMode,
    acceptedExchangeModes: [...(input.acceptedExchangeModes ?? [input.exchangeMode])],
    paymentModes: [...(input.acceptedExchangeModes ?? [input.exchangeMode])],
    collaborationAttributes: input.collaborationAttributes
      ? { ...input.collaborationAttributes }
      : undefined,
    preferredMatchingTopology:
      input.preferredMatchingTopology ?? derived.topology,
  }
}

export function validateOpportunityRecord(
  opportunity: Opportunity,
): ReturnType<typeof validateOpportunityCollaborationModel> {
  return validateOpportunityCollaborationModel(
    opportunityToCollaborationInput(opportunity),
  )
}

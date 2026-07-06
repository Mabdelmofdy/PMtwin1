import {
  validateCollaborationTaxonomy,
  validateOpportunityCollaborationModel,
  VALUE_EXCHANGE_FIELD_GROUPS,
  type ExchangeMode,
} from '@pm-twin/collaboration-models'
import type { WorkflowCollaborationContext } from '../types.ts'

function normalizeMode(mode?: string): string | undefined {
  if (!mode) return undefined
  return mode.toLowerCase().replace(/-/g, '_')
}

function hasField(
  data: Readonly<Record<string, unknown>> | undefined,
  key: string,
): boolean {
  if (!data) return false
  const value = data[key]
  if (value == null || value === '') return false
  if (Array.isArray(value) && value.length === 0) return false
  return true
}

function resolveExchangePayload(
  collaboration?: WorkflowCollaborationContext,
): Readonly<Record<string, unknown>> {
  return {
    ...(collaboration?.exchangeData ?? {}),
    ...(collaboration?.collaborationAttributes ?? {}),
  }
}

export function validateCollaborationPublishRequirements(
  collaboration?: WorkflowCollaborationContext,
): { readonly valid: boolean; readonly errors: readonly string[] } {
  if (!collaboration?.subModelType || !collaboration.exchangeMode) {
    return {
      valid: false,
      errors: ['Collaboration sub-model and exchange mode are required to publish'],
    }
  }

  const taxonomy = validateCollaborationTaxonomy({
    mainCollaborationModel: collaboration.mainCollaborationModel,
    modelType: collaboration.modelType,
    subModelType: collaboration.subModelType,
    exchangeMode: collaboration.exchangeMode,
    acceptedExchangeModes: collaboration.acceptedExchangeModes,
    collaborationAttributes: collaboration.collaborationAttributes,
  })

  if (!taxonomy.valid) {
    return { valid: false, errors: taxonomy.errors }
  }

  const full = validateOpportunityCollaborationModel({
    mainCollaborationModel: collaboration.mainCollaborationModel,
    modelType: collaboration.modelType,
    subModelType: collaboration.subModelType,
    exchangeMode: collaboration.exchangeMode,
    acceptedExchangeModes: collaboration.acceptedExchangeModes,
    collaborationAttributes: collaboration.collaborationAttributes,
  })

  if (!full.valid) {
    return { valid: false, errors: full.errors }
  }

  const mode = normalizeMode(collaboration.exchangeMode) as ExchangeMode | undefined
  if (!mode) {
    return { valid: false, errors: ['Invalid exchange mode'] }
  }

  const exchangeErrors = validateExchangeModeRequirements(mode, collaboration)
  if (exchangeErrors.length > 0) {
    return { valid: false, errors: exchangeErrors }
  }

  const jvErrors = validateJointVentureCommercialRequirements(collaboration)
  if (jvErrors.length > 0) {
    return { valid: false, errors: jvErrors }
  }

  return { valid: true, errors: [] }
}

export function validateExchangeModeRequirements(
  mode: ExchangeMode,
  collaboration?: WorkflowCollaborationContext,
): readonly string[] {
  const payload = resolveExchangePayload(collaboration)
  const group = VALUE_EXCHANGE_FIELD_GROUPS[mode]
  const errors: string[] = []

  for (const field of group.requiredFields) {
    if (!hasField(payload, field)) {
      errors.push(`Missing required ${mode} exchange field: ${field}`)
    }
  }

  if (mode === 'barter' || mode === 'hybrid') {
    const hasBarter =
      hasField(payload, 'barterOffer')
      || hasField(payload, 'offeredService')
      || hasField(payload, 'barterComponent')
    const hasRequest =
      hasField(payload, 'barterPreferences')
      || hasField(payload, 'requestedService')
    if (!hasBarter || !hasRequest) {
      errors.push('Barter exchange requires offered and requested service data')
    }
  }

  return errors
}

export function validateJointVentureCommercialRequirements(
  collaboration?: WorkflowCollaborationContext,
): readonly string[] {
  const main = collaboration?.mainCollaborationModel
  if (main !== 'joint_venture') return []

  const mode = normalizeMode(collaboration?.exchangeMode)
  const payload = resolveExchangePayload(collaboration)
  const errors: string[] = []

  if (mode === 'equity' || mode === 'hybrid') {
    if (
      !hasField(payload, 'equitySplit')
      && !hasField(payload, 'equityPercentage')
      && !hasField(payload, 'equityStructure')
    ) {
      errors.push('Joint venture with equity exchange requires equity commercial terms')
    }
  }

  if (mode === 'profit_sharing' || mode === 'hybrid') {
    if (!hasField(payload, 'profitSplit') && !hasField(payload, 'profitDistribution')) {
      errors.push('Joint venture with profit sharing requires profit split terms')
    }
  }

  return errors
}

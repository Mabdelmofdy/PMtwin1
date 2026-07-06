import { getSubModel, listSubModelsForMain } from '../registry/index.ts'
import type {
  CollaborationTaxonomyInput,
  CollaborationValidationResult,
  DerivedMatchingTopology,
  ExchangeMode,
  MatchTopology,
} from '../types.ts'
import {
  inferMainCollaborationModel,
  isMatchTopologyValue,
  normalizeSubModelType,
} from '../legacy/normalize.ts'

function normalizeExchangeMode(mode: string | undefined): string | undefined {
  if (!mode) return undefined
  return mode.toLowerCase().replace(/-/g, '_').trim()
}

export function deriveMatchingTopology(
  input: CollaborationTaxonomyInput,
): DerivedMatchingTopology {
  const main = inferMainCollaborationModel(input)
  const subKey = normalizeSubModelType(input.subModelType, input)
  const sub = subKey ? getSubModel(subKey) : undefined
  const exchange = normalizeExchangeMode(input.exchangeMode)

  if (sub?.allowedMatchTopologies.length === 1) {
    const topology = sub.allowedMatchTopologies[0]
    return {
      topology,
      reason: `${sub.name} allows ${topology} matching only`,
    }
  }

  if (main === 'cash_subcontracting' || subKey === 'task_based' || subKey === 'competition_rfp') {
    return { topology: 'one_way', reason: 'Cash subcontracting uses one-way need/offer matching' }
  }

  if (main === 'resource_sharing') {
    const transactionType = String(
      input.collaborationAttributes?.transactionType ?? '',
    ).toLowerCase()
    if (transactionType === 'barter' || exchange === 'barter') {
      return {
        topology: 'circular',
        reason: 'Multi-party resource barter may form circular exchange rings',
        alternatives: ['one_way'],
      }
    }
    return {
      topology: 'one_way',
      reason: 'Resource sharing defaults to one-way matching',
      alternatives: ['circular'],
    }
  }

  if (main === 'service_exchange' || exchange === 'barter') {
    return { topology: 'two_way', reason: 'Service exchange / barter uses reciprocal two-way matching' }
  }

  if (
    main === 'joint_venture'
    || subKey === 'consortium'
    || subKey === 'project_jv'
    || subKey === 'spv'
    || subKey === 'strategic_jv'
  ) {
    return { topology: 'consortium', reason: 'Joint venture sub-models use consortium group formation' }
  }

  if (main === 'hiring' || subKey === 'professional_hiring' || subKey === 'consultant_hiring') {
    return {
      topology: 'one_way',
      reason: 'Hiring uses one-way matching (Application path documented separately)',
    }
  }

  if (exchange === 'barter') {
    return { topology: 'two_way', reason: 'Barter exchange mode implies two-way matching' }
  }

  return { topology: 'one_way', reason: 'Default matching topology' }
}

export function validateCollaborationTaxonomy(
  input: CollaborationTaxonomyInput,
): CollaborationValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const rawSub = input.subModelType
  if (rawSub && isMatchTopologyValue(rawSub)) {
    errors.push(
      `subModelType must not store matching topology "${rawSub}" — use preferredMatchingTopology instead`,
    )
  }

  const mainKey = inferMainCollaborationModel(input)
  const subKey = normalizeSubModelType(input.subModelType, input)
  const modelType = input.modelType
  const exchange = normalizeExchangeMode(input.exchangeMode)
  const accepted = (input.acceptedExchangeModes ?? [])
    .map((mode) => normalizeExchangeMode(mode))
    .filter((mode): mode is ExchangeMode => Boolean(mode))

  if (!mainKey) {
    errors.push('mainCollaborationModel could not be resolved')
  }

  if (!subKey) {
    errors.push('subModelType is required and must be a canonical collaboration sub-model')
  } else {
    const sub = getSubModel(subKey)
    if (!sub) {
      errors.push(`Unknown subModelType "${subKey}"`)
    } else {
      if (mainKey && sub.mainCollaborationModel !== mainKey) {
        errors.push(
          `subModelType "${subKey}" belongs to ${sub.mainCollaborationModel}, not ${mainKey}`,
        )
      }
      if (modelType && sub.modelType !== modelType) {
        errors.push(
          `subModelType "${subKey}" requires modelType "${sub.modelType}", got "${modelType}"`,
        )
      }
      if (exchange && !sub.allowedExchangeModes.includes(exchange as ExchangeMode)) {
        errors.push(
          `exchangeMode "${exchange}" is not allowed for sub-model "${subKey}"`,
        )
      }
      for (const mode of accepted) {
        if (!sub.allowedExchangeModes.includes(mode)) {
          warnings.push(
            `acceptedExchangeModes includes "${mode}" which is not typical for "${subKey}"`,
          )
        }
      }
    }
  }

  if (mainKey) {
    const allowedSubs = listSubModelsForMain(mainKey).map((s) => s.key)
    if (subKey && !allowedSubs.includes(subKey as never)) {
      errors.push(`subModelType "${subKey}" is not valid for main model "${mainKey}"`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export function validateSubModelAttributes(
  subModelType: string,
  attributes: Readonly<Record<string, unknown>> | undefined,
): CollaborationValidationResult {
  const errors: string[] = []
  const subKey = normalizeSubModelType(subModelType)
  const sub = subKey ? getSubModel(subKey) : undefined
  if (!sub) {
    return { valid: false, errors: [`Unknown subModelType "${subModelType}"`], warnings: [] }
  }

  const data = attributes ?? {}
  for (const fieldKey of sub.requiredFields) {
    const value = data[fieldKey]
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
      errors.push(`Missing required collaboration attribute: ${fieldKey}`)
    }
  }

  return { valid: errors.length === 0, errors, warnings: [] }
}

export function validateOpportunityCollaborationModel(
  input: CollaborationTaxonomyInput,
): CollaborationValidationResult {
  const taxonomy = validateCollaborationTaxonomy(input)
  if (!taxonomy.valid) return taxonomy

  const subKey = normalizeSubModelType(input.subModelType, input)
  if (!subKey) return taxonomy

  const attributes = validateSubModelAttributes(
    subKey,
    input.collaborationAttributes,
  )

  return {
    valid: taxonomy.valid && attributes.valid,
    errors: [...taxonomy.errors, ...attributes.errors],
    warnings: [...taxonomy.warnings, ...attributes.warnings],
  }
}

export function recommendMatchingTopology(
  input: CollaborationTaxonomyInput,
): MatchTopology {
  return deriveMatchingTopology(input).topology
}

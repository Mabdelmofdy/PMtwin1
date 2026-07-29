import { validateOpportunityCollaborationModel } from '@pm-twin/collaboration-models'
import { skillNames } from '@/domain/opportunity-creation'
import { isScopeId } from '@/domain/locations'
import {
  buildCollaborationCommandPayload,
  type OpportunityDraft,
} from './draft-model.ts'

export type CreateOpportunityValidationResult = {
  readonly valid: boolean
  readonly errors: readonly string[]
}

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim())
}

/**
 * Client-side gate for first-time opportunity create.
 * Mirrors wizard required markers + collaboration sub-model required fields.
 */
export function validateCreateOpportunityDraft(
  draft: OpportunityDraft,
): CreateOpportunityValidationResult {
  const errors: string[] = []

  if (draft.intent !== 'need' && draft.intent !== 'offer') {
    errors.push('Post type (Need or Offer) is required')
  }
  if (!hasText(draft.title)) {
    errors.push('Title is required')
  }
  if (!hasText(draft.description)) {
    errors.push('Short description is required')
  }
  if (!hasText(draft.sector)) {
    errors.push('Category or profession is required')
  }
  if (!hasText(draft.targetRole)) {
    errors.push('Target role is required')
  }
  if (!hasText(draft.location)) {
    errors.push('Primary location is required')
  } else if (!isScopeId(draft.location.trim())) {
    errors.push('Primary location must be a known location from the list')
  }
  if (draft.coverageAreas.length > 25) {
    errors.push('Coverage areas are limited to 25 selections')
  }
  for (const area of draft.coverageAreas) {
    if (!isScopeId(area)) {
      errors.push(`Unknown coverage area: ${area}`)
      break
    }
  }
  for (const resource of draft.resources) {
    if (resource.location && !isScopeId(resource.location)) {
      errors.push(`Unknown asset location on resource "${resource.name || 'untitled'}"`)
      break
    }
  }
  if (!hasText(draft.startDate)) {
    errors.push('Start date is required')
  }

  const namedSkills = skillNames(draft.structuredSkills)
  const csvSkills = draft.skills
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  if (namedSkills.length === 0 && csvSkills.length === 0) {
    errors.push(
      draft.intent === 'offer'
        ? 'At least one offered skill is required'
        : 'At least one required skill is required',
    )
  }
  if (!hasText(draft.services)) {
    errors.push(
      draft.intent === 'offer'
        ? 'Services offered are required'
        : 'Services required are required',
    )
  }

  if (!hasText(draft.mainCollaborationModel) || !hasText(draft.subModelType)) {
    errors.push('Collaboration model and sub-model are required')
  } else {
    const payload = buildCollaborationCommandPayload(draft)
    const collaboration = validateOpportunityCollaborationModel({
      mainCollaborationModel: payload.mainCollaborationModel,
      modelType: payload.modelType,
      subModelType: payload.subModelType,
      exchangeMode: payload.exchangeMode,
      acceptedExchangeModes: payload.acceptedExchangeModes,
      collaborationAttributes: payload.collaborationAttributes,
    })
    if (!collaboration.valid) {
      errors.push(...collaboration.errors)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

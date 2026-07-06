import type {
  WorkflowActionKey,
  WorkflowContext,
  WorkflowTransitionValidation,
} from '../types.ts'
import { getActionDefinition } from '../actions/action-registry.ts'
import { getWorkflowDefinition } from '../registry/index.ts'
import { canonicalEntityStatus } from '../lifecycle-helpers.ts'
import {
  findAgreedApplicationNegotiation,
  hasActiveContractForDeal,
  hasBlockingApplicationNegotiation,
  hasBlockingPostMatchNegotiation,
  resolveWorkflowKeys,
} from './resolve-workflow.ts'
import {
  validateCollaborationPublishRequirements,
  validateExchangeModeRequirements,
  validateJointVentureCommercialRequirements,
} from './collaboration-guards.ts'
import { findWorkflowAction } from './next-actions.ts'
import type { ExchangeMode } from '@pm-twin/collaboration-models'

const NEGOTIATION_ENTITY = 'negotiation'
const APPLICATION_ENTITY = 'application'
const MATCH_ENTITY = 'match'
const DEAL_ENTITY = 'deal'

function validateActionBusinessRules(
  context: WorkflowContext,
  actionKey: WorkflowActionKey,
): string[] {
  const errors: string[] = []

  switch (actionKey) {
    case 'publish_opportunity': {
      const publish = validateCollaborationPublishRequirements(context.collaboration)
      if (!publish.valid) errors.push(...publish.errors)
      if (context.collaboration) {
        const mode = (context.collaboration.exchangeMode ?? '')
          .toLowerCase()
          .replace(/-/g, '_') as ExchangeMode
        if (mode) {
          errors.push(...validateExchangeModeRequirements(mode, context.collaboration))
        }
        errors.push(...validateJointVentureCommercialRequirements(context.collaboration))
      }
      break
    }
    case 'start_negotiation_from_post_match': {
      const status = canonicalEntityStatus(MATCH_ENTITY, context.postMatch?.status)
      if (status !== 'confirmed') {
        errors.push('PostMatch must be confirmed before starting negotiation')
      }
      if (hasBlockingPostMatchNegotiation(context)) {
        errors.push('An active or agreed negotiation already exists for this PostMatch')
      }
      break
    }
    case 'start_negotiation_from_application': {
      const status = canonicalEntityStatus(APPLICATION_ENTITY, context.application?.status)
      if (status !== 'accepted') {
        errors.push('Application must be accepted before starting hiring negotiation')
      }
      if (hasBlockingApplicationNegotiation(context)) {
        errors.push('A hiring negotiation already exists for this application')
      }
      break
    }
    case 'create_deal_from_negotiation':
    case 'create_deal_from_post_match': {
      const status = canonicalEntityStatus(NEGOTIATION_ENTITY, context.negotiation?.status)
      if (status !== 'agreed') {
        errors.push('Negotiation must be agreed before creating a deal')
      }
      if (context.linkage?.dealForNegotiation?.id) {
        errors.push('A deal already exists for this negotiation')
      }
      break
    }
    case 'create_deal_from_application': {
      const agreed = findAgreedApplicationNegotiation(context)
      if (!agreed?.id) {
        errors.push('An agreed application-linked negotiation is required before creating a deal')
      }
      if (context.linkage?.dealForApplication?.id || context.application?.dealId) {
        errors.push('A deal already exists for this application')
      }
      break
    }
    case 'create_contract_from_deal': {
      if (!context.deal?.id) {
        errors.push('Deal must exist before creating a contract')
      }
      const status = canonicalEntityStatus(DEAL_ENTITY, context.deal?.status)
      if (!['draft', 'review', 'signing'].includes(status)) {
        errors.push('Deal must be in draft, review, or signing to create a contract')
      }
      if (hasActiveContractForDeal(context)) {
        errors.push('An active contract already exists for this deal')
      }
      break
    }
    default:
      break
  }

  return errors
}

export function validateWorkflowTransition(
  context: WorkflowContext,
  actionKey: WorkflowActionKey,
): WorkflowTransitionValidation {
  const errors: string[] = [...validateActionBusinessRules(context, actionKey)]
  const warnings: string[] = []

  const action = findWorkflowAction(context, actionKey)
  if (!action) {
    errors.push(`Action "${actionKey}" is not visible in the current workflow context`)
  } else if (!action.enabled) {
    errors.push(action.disabledReason ?? `Action "${actionKey}" is disabled`)
  }

  const { primary } = resolveWorkflowKeys(context)
  const workflow = getWorkflowDefinition(primary)
  const definition = getActionDefinition(actionKey)

  if (!workflow.allowedCommands.includes(definition.commandType)) {
    const hiringAllowed =
      primary === 'hiring'
      && ['StartNegotiationFromApplication', 'CreateDealFromApplication', 'AgreeNegotiation', 'CreateContractFromDeal', 'SignContract', 'CompleteContract'].includes(definition.commandType)
    const marketplaceAllowed =
      primary === 'marketplace'
      && workflow.allowedCommands.includes(definition.commandType)

    if (!hiringAllowed && !marketplaceAllowed) {
      errors.push(
        `Command "${definition.commandType}" is not allowed in workflow "${primary}"`,
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

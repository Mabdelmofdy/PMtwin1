import type { Command, CommandResult } from '@pm-twin/commands'
import type { Party } from '@pm-twin/party'
import type { PlatformUser } from '@/types/domain.ts'
import type { CommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'

export const VETTING_MUTATION_BLOCKED_MESSAGE =
  'Account pending review. You can browse but cannot perform this action until approved.'

export const VETTING_GUARDED_COMMAND_TYPES = new Set([
  'CreateOpportunity',
  'UpdateOpportunity',
  'PublishOpportunity',
  'DeleteOpportunity',
  'ArchiveOpportunity',
  'AcceptPostMatch',
  'DeclinePostMatch',
  'StartNegotiationFromPostMatch',
  'StartNegotiationFromApplication',
  'SendNegotiationMessage',
  'SubmitNegotiationOffer',
  'SubmitNegotiationCounterOffer',
  'CreateCommercialAgreementFromPostMatch',
  'CreateCommercialAgreementFromApplication',
  'CreateCommercialAgreementFromNegotiation',
  'AwardCommercialAgreement',
  'CreateContractFromCommercialAgreement',
  'CreateContractFromDeal',
  'SignContract',
])

export type VettingActorContext = {
  readonly user: PlatformUser
  readonly activeParty: Party | null
}

export type VettingMutationEvaluation = {
  readonly allowed: boolean
  readonly message?: string
}

export function canMutateAsVettedUser(
  user: PlatformUser,
  activeParty: Party | null | undefined,
): boolean {
  if (user.role === 'admin') return true
  if (user.status !== 'active') return false
  if (!activeParty) return false
  if (activeParty.status !== 'active') return false
  return true
}

export function isVettingRestrictedUser(user: PlatformUser): boolean {
  return (
    user.status === 'pending_vetting' ||
    user.status === 'pending' ||
    user.status === 'clarification_requested'
  )
}

export function requiresVettingMutationGuard(commandType: string): boolean {
  return VETTING_GUARDED_COMMAND_TYPES.has(commandType)
}

export function evaluateVettingMutationGuard(
  command: Command,
  actor: CommandPermissionActor | null,
  resolveContext: () => VettingActorContext | null,
): VettingMutationEvaluation {
  if (!requiresVettingMutationGuard(command.commandType)) {
    return { allowed: true }
  }

  if (!actor) {
    return {
      allowed: false,
      message: VETTING_MUTATION_BLOCKED_MESSAGE,
    }
  }

  if (actor.userRole === 'admin') {
    return { allowed: true }
  }

  const context = resolveContext()
  if (!context) {
    return {
      allowed: false,
      message: VETTING_MUTATION_BLOCKED_MESSAGE,
    }
  }

  if (!canMutateAsVettedUser(context.user, context.activeParty)) {
    return {
      allowed: false,
      message: VETTING_MUTATION_BLOCKED_MESSAGE,
    }
  }

  return { allowed: true }
}

export function buildVettingMutationFailureResult(
  command: Command,
  evaluation: VettingMutationEvaluation,
): CommandResult {
  return {
    success: false,
    aggregateId: command.aggregateId,
    commandType: command.commandType,
    errors: [evaluation.message ?? VETTING_MUTATION_BLOCKED_MESSAGE],
  }
}

import type { CommandResult } from '@pm-twin/commands'
import { allowedTransitions, isTerminal, toCanonical } from '@pm-twin/lifecycle'
import type { Negotiation } from '@/types/domain.ts'
import { negotiationCommandService } from '@/services/negotiation-command-service.ts'
import { formatCanonicalStatusLabel } from '@/lib/status-display.ts'

const NEGOTIATION_ENTITY = 'negotiation' as const

/** Targets covered by AgreeNegotiation / CancelNegotiation semantic commands. */
const SEMANTIC_NEGOTIATION_TARGETS = new Set(['agreed', 'cancelled'])

const NEGOTIATION_TRANSITION_LABELS: Record<string, string> = {
  countered: 'Submit proposal',
  active: 'Accept updated proposal',
  expired: 'Mark expired',
}

export type NegotiationTransitionOption = {
  readonly targetStatus: string
  readonly label: string
}

export type NegotiationUiActionResult =
  | { readonly success: true; readonly status: string }
  | { readonly success: false; readonly message: string }

export type NegotiationUiActionsDeps = {
  readonly agreeNegotiation?: (negotiationId: string) => {
    readonly result: CommandResult
    readonly negotiation: Negotiation | null
  }
  readonly cancelNegotiation?: (negotiationId: string) => {
    readonly result: CommandResult
    readonly negotiation: Negotiation | null
  }
  readonly transitionNegotiationStatus?: (
    negotiationId: string,
    targetStatus: string,
  ) => {
    readonly result: CommandResult
    readonly negotiation: Negotiation | null
  }
  readonly readNegotiationStatus?: (negotiationId: string) => string | undefined
}

function formatCommandErrors(result: CommandResult): string {
  if (result.errors && result.errors.length > 0) {
    return result.errors.join('. ')
  }
  return 'Negotiation action failed.'
}

function readStatus(
  negotiationId: string,
  negotiation: Negotiation | null | undefined,
  deps?: NegotiationUiActionsDeps,
): string {
  if (negotiation?.status) return negotiation.status
  const read = deps?.readNegotiationStatus
  return read?.(negotiationId) ?? ''
}

export function canShowAgreeNegotiation(
  negotiation: Negotiation | null | undefined,
): boolean {
  if (!negotiation?.id) return false
  if (isTerminal(NEGOTIATION_ENTITY, negotiation.status)) return false
  return allowedTransitions(NEGOTIATION_ENTITY, negotiation.status).includes(
    'agreed',
  )
}

export function canShowCancelNegotiation(
  negotiation: Negotiation | null | undefined,
): boolean {
  if (!negotiation?.id) return false
  if (isTerminal(NEGOTIATION_ENTITY, negotiation.status)) return false
  return allowedTransitions(
    NEGOTIATION_ENTITY,
    negotiation.status,
  ).includes('cancelled')
}

export function agreeNegotiationUiAction(
  negotiationId: string,
  deps?: NegotiationUiActionsDeps,
): NegotiationUiActionResult {
  const agree =
    deps?.agreeNegotiation ??
    negotiationCommandService.agreeNegotiation.bind(negotiationCommandService)

  const { result, negotiation } = agree(negotiationId)
  if (!result.success) {
    return { success: false, message: formatCommandErrors(result) }
  }

  return {
    success: true,
    status: readStatus(negotiationId, negotiation, deps),
  }
}

export function cancelNegotiationUiAction(
  negotiationId: string,
  deps?: NegotiationUiActionsDeps,
): NegotiationUiActionResult {
  const cancel =
    deps?.cancelNegotiation ??
    negotiationCommandService.cancelNegotiation.bind(negotiationCommandService)

  const { result, negotiation } = cancel(negotiationId)
  if (!result.success) {
    return { success: false, message: formatCommandErrors(result) }
  }

  return {
    success: true,
    status: readStatus(negotiationId, negotiation, deps),
  }
}

export function isNegotiationActiveForActions(
  negotiation: Negotiation | null | undefined,
): boolean {
  if (!negotiation?.status) return false
  const canonical = toCanonical(NEGOTIATION_ENTITY, negotiation.status) ?? ''
  return canonical === 'active' || canonical === 'countered'
}

function transitionLabel(targetStatus: string): string {
  return (
    NEGOTIATION_TRANSITION_LABELS[targetStatus] ??
    `Move to ${formatCanonicalStatusLabel(NEGOTIATION_ENTITY, targetStatus)}`
  )
}

export function getNegotiationTransitionOptions(
  negotiation: Negotiation | null | undefined,
): readonly NegotiationTransitionOption[] {
  if (!negotiation?.id) return []
  if (isTerminal(NEGOTIATION_ENTITY, negotiation.status)) return []

  return allowedTransitions(NEGOTIATION_ENTITY, negotiation.status)
    .filter((targetStatus) => !SEMANTIC_NEGOTIATION_TARGETS.has(targetStatus))
    .map((targetStatus) => ({
      targetStatus,
      label: transitionLabel(targetStatus),
    }))
}

export function canShowNegotiationTransition(
  negotiation: Negotiation | null | undefined,
  targetStatus: string,
): boolean {
  return getNegotiationTransitionOptions(negotiation).some(
    (option) => option.targetStatus === targetStatus,
  )
}

export function transitionNegotiationStatusUiAction(
  negotiationId: string,
  targetStatus: string,
  deps?: NegotiationUiActionsDeps,
): NegotiationUiActionResult {
  const transition =
    deps?.transitionNegotiationStatus ??
    negotiationCommandService.transitionNegotiationStatus.bind(
      negotiationCommandService,
    )

  const { result, negotiation } = transition(negotiationId, targetStatus)
  if (!result.success) {
    return { success: false, message: formatCommandErrors(result) }
  }

  return {
    success: true,
    status: readStatus(negotiationId, negotiation, deps),
  }
}

import type { CommandResult } from '@pm-twin/commands'
import { allowedTransitions, isTerminal } from '@pm-twin/lifecycle'
import type { Deal } from '@/types/domain.ts'
import { dealCommandService } from '@/services/deal-command-service.ts'
import { formatCanonicalStatusLabel } from '@/lib/status-display.ts'

const DEAL_ENTITY = 'deal' as const

const DEAL_TRANSITION_LABELS: Record<string, string> = {
  review: 'Submit for review',
  signing: 'Move to signing',
  executing: 'Start execution',
  completed: 'Mark completed',
  cancelled: 'Cancel deal',
}

export type DealTransitionOption = {
  readonly targetStatus: string
  readonly label: string
}

export type DealTransitionUiActionResult =
  | { readonly success: true; readonly status: string }
  | { readonly success: false; readonly message: string }

export type DealTransitionUiActionsDeps = {
  readonly transitionDealStatus?: (
    dealId: string,
    targetStatus: string,
  ) => {
    readonly result: CommandResult
    readonly deal: Deal | null
  }
  readonly readDealStatus?: (dealId: string) => string | undefined
}

function formatCommandErrors(result: CommandResult): string {
  if (result.errors && result.errors.length > 0) {
    return result.errors.join('. ')
  }
  return 'Deal status could not be updated.'
}

function transitionLabel(targetStatus: string): string {
  return (
    DEAL_TRANSITION_LABELS[targetStatus] ??
    `Move to ${formatCanonicalStatusLabel(DEAL_ENTITY, targetStatus)}`
  )
}

export function listDealTransitionOptions(
  deal: Deal | null | undefined,
): readonly DealTransitionOption[] {
  if (!deal?.id) return []
  if (isTerminal(DEAL_ENTITY, deal.status)) return []

  return allowedTransitions(DEAL_ENTITY, deal.status).map((targetStatus) => ({
    targetStatus,
    label: transitionLabel(targetStatus),
  }))
}

export function canShowDealTransition(
  deal: Deal | null | undefined,
  targetStatus: string,
): boolean {
  return listDealTransitionOptions(deal).some(
    (option) => option.targetStatus === targetStatus,
  )
}

export function transitionDealStatusUiAction(
  dealId: string,
  targetStatus: string,
  deps?: DealTransitionUiActionsDeps,
): DealTransitionUiActionResult {
  const transition =
    deps?.transitionDealStatus ??
    dealCommandService.transitionDealStatus.bind(dealCommandService)

  const { result, deal } = transition(dealId, targetStatus)
  if (!result.success) {
    return { success: false, message: formatCommandErrors(result) }
  }

  const status =
    deal?.status ??
    deps?.readDealStatus?.(dealId) ??
    targetStatus

  return { success: true, status }
}

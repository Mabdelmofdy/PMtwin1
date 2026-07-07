import type { CommandResult } from '@pm-twin/commands'
import { allowedTransitions, isTerminal } from '@pm-twin/lifecycle'
import type { Deal } from '@/types/domain.ts'
import { commercialAgreementCommandService } from '@/services/commercial-agreement-command-service.ts'
import { formatCanonicalStatusLabel } from '@/lib/status-display.ts'

const COMMERCIAL_AGREEMENT_LIFECYCLE_ENTITY = 'commercial_agreement' as const
const COMMERCIAL_AGREEMENT_STATUS_ENTITY = 'deal' as const

const COMMERCIAL_AGREEMENT_TRANSITION_LABELS: Record<string, string> = {
  review: 'Submit for review',
  signing: 'Move to signing',
  executing: 'Start execution',
  completed: 'Mark completed',
  cancelled: 'Cancel commercial agreement',
}

export type CommercialAgreementTransitionOption = {
  readonly targetStatus: string
  readonly label: string
}

export type CommercialAgreementTransitionUiActionResult =
  | { readonly success: true; readonly status: string }
  | { readonly success: false; readonly message: string }

export type CommercialAgreementTransitionUiActionsDeps = {
  readonly transitionCommercialAgreementStatus?: (
    commercialAgreementId: string,
    targetStatus: string,
  ) => {
    readonly result: CommandResult
    readonly commercialAgreement: Deal | null
  }
  readonly readCommercialAgreementStatus?: (commercialAgreementId: string) => string | undefined
}

function formatCommandErrors(result: CommandResult): string {
  if (result.errors && result.errors.length > 0) {
    return result.errors.join('. ')
  }
  return 'Commercial agreement status could not be updated.'
}

function transitionLabel(targetStatus: string): string {
  return (
    COMMERCIAL_AGREEMENT_TRANSITION_LABELS[targetStatus] ??
    `Move to ${formatCanonicalStatusLabel(COMMERCIAL_AGREEMENT_STATUS_ENTITY, targetStatus)}`
  )
}

export function listCommercialAgreementTransitionOptions(
  commercialAgreement: Deal | null | undefined,
): readonly CommercialAgreementTransitionOption[] {
  if (!commercialAgreement?.id) return []
  if (isTerminal(COMMERCIAL_AGREEMENT_LIFECYCLE_ENTITY, commercialAgreement.status)) return []

  return allowedTransitions(COMMERCIAL_AGREEMENT_LIFECYCLE_ENTITY, commercialAgreement.status).map(
    (targetStatus) => ({
      targetStatus,
      label: transitionLabel(targetStatus),
    }),
  )
}

export function canShowCommercialAgreementTransition(
  commercialAgreement: Deal | null | undefined,
  targetStatus: string,
): boolean {
  return listCommercialAgreementTransitionOptions(commercialAgreement).some(
    (option) => option.targetStatus === targetStatus,
  )
}

export function transitionCommercialAgreementStatusUiAction(
  commercialAgreementId: string,
  targetStatus: string,
  deps?: CommercialAgreementTransitionUiActionsDeps,
): CommercialAgreementTransitionUiActionResult {
  const transition =
    deps?.transitionCommercialAgreementStatus
    ?? commercialAgreementCommandService.transitionCommercialAgreementStatus.bind(
      commercialAgreementCommandService,
    )

  const { result, commercialAgreement } = transition(commercialAgreementId, targetStatus)
  if (!result.success) {
    return { success: false, message: formatCommandErrors(result) }
  }

  const status =
    commercialAgreement?.status
    ?? deps?.readCommercialAgreementStatus?.(commercialAgreementId)
    ?? targetStatus

  return { success: true, status }
}

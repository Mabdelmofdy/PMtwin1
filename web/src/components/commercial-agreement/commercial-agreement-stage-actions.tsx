import { useState } from 'react'
import { toast } from 'sonner'
import type { Deal } from '@/types/domain.ts'
import { commercialAgreementCommandService } from '@/services/commercial-agreement-command-service.ts'
import {
  listCommercialAgreementTransitionOptions,
  transitionCommercialAgreementStatusUiAction,
} from '@/lib/commercial-agreement-transition-ui-actions.ts'
import { PmButton } from '@/components/ui/pm-button'
import { PmMoreActions, type PmMoreActionItem } from '@/components/ui/pm-more-actions'

type CommercialAgreementStageActionsProps = {
  readonly commercialAgreement: Deal | null | undefined
  readonly className?: string
}

export function CommercialAgreementStageActions({
  commercialAgreement,
  className,
}: CommercialAgreementStageActionsProps) {
  const [pendingTarget, setPendingTarget] = useState<string | null>(null)
  const [isAwarding, setIsAwarding] = useState(false)
  const options = listCommercialAgreementTransitionOptions(commercialAgreement)

  if (!commercialAgreement?.id || options.length === 0) {
    return null
  }

  const handleTransition = (targetStatus: string) => {
    if (!commercialAgreement.id || pendingTarget) return
    setPendingTarget(targetStatus)
    const result = transitionCommercialAgreementStatusUiAction(
      commercialAgreement.id,
      targetStatus,
    )
    setPendingTarget(null)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    toast.success('Commercial agreement status updated', {
      description: `Commercial agreement is now ${result.status}.`,
    })
  }

  const forwardOptions = options.filter((option) => option.targetStatus !== 'cancelled')
  const cancelOption = options.find((option) => option.targetStatus === 'cancelled')
  const primaryOption = forwardOptions[0] ?? cancelOption

  const moreItems: PmMoreActionItem[] = [
    ...forwardOptions.slice(1).map((option) => ({
      id: option.targetStatus,
      label: option.label,
      onSelect: () => handleTransition(option.targetStatus),
      disabled: pendingTarget !== null,
    })),
    ...(cancelOption && primaryOption?.targetStatus !== 'cancelled'
      ? [
          {
            id: cancelOption.targetStatus,
            label: cancelOption.label,
            onSelect: () => handleTransition(cancelOption.targetStatus),
            variant: 'destructive' as const,
            separatorBefore: forwardOptions.length > 1,
            disabled: pendingTarget !== null,
          },
        ]
      : []),
  ]

  if (!primaryOption) {
    return null
  }

  const isPrimaryCancel = primaryOption.targetStatus === 'cancelled'
  const canAward =
    commercialAgreement.awardStatus !== 'awarded'
    && commercialAgreement.awardStatus !== 'rejected'
    && commercialAgreement.awardStatus !== 'withdrawn'
    && ['draft', 'active', 'signing'].includes((commercialAgreement.status ?? '').toLowerCase())

  const handleAward = () => {
    if (!commercialAgreement.id || isAwarding) return
    setIsAwarding(true)
    const { result } = commercialAgreementCommandService.awardCommercialAgreement(
      commercialAgreement.id,
      undefined,
      true,
    )
    setIsAwarding(false)
    if (!result.success) {
      toast.error(result.errors?.join('\n') ?? 'Failed to award commercial agreement')
      return
    }
    toast.success('Commercial agreement awarded')
  }

  return (
    <div className={className ?? 'flex flex-col gap-2'}>
      {canAward ? (
        <PmButton
          type="button"
          className="w-full cursor-pointer"
          disabled={pendingTarget !== null || isAwarding}
          onClick={handleAward}
        >
          {isAwarding ? 'Awarding…' : 'Award commercial agreement'}
        </PmButton>
      ) : null}
      <PmButton
        type="button"
        variant={isPrimaryCancel ? 'outline' : 'default'}
        className="w-full cursor-pointer"
        disabled={pendingTarget !== null}
        onClick={() => handleTransition(primaryOption.targetStatus)}
      >
        {pendingTarget === primaryOption.targetStatus
          ? 'Updating…'
          : primaryOption.label}
      </PmButton>
      {moreItems.length > 0 ? (
        <PmMoreActions
          items={moreItems}
          label="More commercial agreement transitions"
          className="self-end"
        />
      ) : null}
    </div>
  )
}

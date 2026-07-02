import { useState } from 'react'
import { toast } from 'sonner'
import type { Deal } from '@/types/domain.ts'
import {
  listDealTransitionOptions,
  transitionDealStatusUiAction,
} from '@/lib/deal-transition-ui-actions.ts'
import { PmButton } from '@/components/ui/pm-button'
import { PmMoreActions, type PmMoreActionItem } from '@/components/ui/pm-more-actions'

type DealStageActionsProps = {
  readonly deal: Deal | null | undefined
  readonly className?: string
}

export function DealStageActions({ deal, className }: DealStageActionsProps) {
  const [pendingTarget, setPendingTarget] = useState<string | null>(null)
  const options = listDealTransitionOptions(deal)

  if (!deal?.id || options.length === 0) {
    return null
  }

  const handleTransition = (targetStatus: string) => {
    if (!deal.id || pendingTarget) return
    setPendingTarget(targetStatus)
    const result = transitionDealStatusUiAction(deal.id, targetStatus)
    setPendingTarget(null)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    toast.success('Deal status updated', {
      description: `Deal is now ${result.status}.`,
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

  return (
    <div className={className ?? 'flex flex-col gap-2'}>
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
          label="More deal transitions"
          className="self-end"
        />
      ) : null}
    </div>
  )
}

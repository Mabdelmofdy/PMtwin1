import { useState } from 'react'
import { toast } from 'sonner'
import type { Deal } from '@/types/domain.ts'
import {
  listDealTransitionOptions,
  transitionDealStatusUiAction,
} from '@/lib/deal-transition-ui-actions.ts'
import { Button } from '@/components/ui/button'

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

  return (
    <div className={className ?? 'flex flex-wrap gap-2'}>
      {options.map((option) => (
        <Button
          key={option.targetStatus}
          type="button"
          variant={option.targetStatus === 'cancelled' ? 'outline' : 'default'}
          className="cursor-pointer"
          disabled={pendingTarget !== null}
          onClick={() => handleTransition(option.targetStatus)}
        >
          {pendingTarget === option.targetStatus
            ? 'Updating…'
            : option.label}
        </Button>
      ))}
    </div>
  )
}

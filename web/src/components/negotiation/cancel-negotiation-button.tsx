import { useState } from 'react'
import { toast } from 'sonner'
import type { Negotiation } from '@/types/domain.ts'
import {
  cancelNegotiationUiAction,
  canShowCancelNegotiation,
} from '@/lib/negotiation-ui-actions.ts'
import { PmButton } from '@/components/ui/pm-button'

type CancelNegotiationButtonProps = {
  readonly negotiation: Negotiation | null | undefined
  readonly className?: string
  readonly variant?: 'default' | 'outline' | 'secondary' | 'destructive'
}

export function CancelNegotiationButton({
  negotiation,
  className,
  variant = 'outline',
}: CancelNegotiationButtonProps) {
  const [pending, setPending] = useState(false)

  if (!canShowCancelNegotiation(negotiation)) {
    return null
  }

  const handleCancel = () => {
    if (!negotiation?.id || pending) return
    setPending(true)
    const result = cancelNegotiationUiAction(negotiation.id)
    setPending(false)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    toast.success('Negotiation cancelled')
  }

  return (
    <PmButton
      type="button"
      variant={variant}
      className={className ?? 'cursor-pointer'}
      disabled={pending}
      onClick={handleCancel}
    >
      {pending ? 'Cancelling…' : 'Cancel negotiation'}
    </PmButton>
  )
}

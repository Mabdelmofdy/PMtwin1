import { useState } from 'react'
import { toast } from 'sonner'
import type { Negotiation } from '@/types/domain.ts'
import {
  agreeNegotiationUiAction,
  canShowAgreeNegotiation,
} from '@/lib/negotiation-ui-actions.ts'
import { PmButton } from '@/components/ui/pm-button'

type AgreeNegotiationButtonProps = {
  readonly negotiation: Negotiation | null | undefined
  readonly className?: string
  readonly variant?: 'default' | 'outline' | 'secondary'
}

export function AgreeNegotiationButton({
  negotiation,
  className,
  variant = 'default',
}: AgreeNegotiationButtonProps) {
  const [pending, setPending] = useState(false)

  if (!canShowAgreeNegotiation(negotiation)) {
    return null
  }

  const handleAgree = () => {
    if (!negotiation?.id || pending) return
    setPending(true)
    const result = agreeNegotiationUiAction(negotiation.id)
    setPending(false)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    toast.success('Terms agreed', {
      description: 'You can create a commercial agreement workspace when ready.',
    })
  }

  return (
    <PmButton
      type="button"
      variant={variant}
      className={className ?? 'cursor-pointer'}
      disabled={pending}
      onClick={handleAgree}
    >
      {pending ? 'Agreeing…' : 'Agree terms'}
    </PmButton>
  )
}

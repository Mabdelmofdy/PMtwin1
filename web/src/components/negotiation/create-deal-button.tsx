import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { Negotiation } from '@/types/domain.ts'
import {
  canShowCreateDealFromNegotiation,
  createDealFromNegotiationUiAction,
} from '@/lib/create-deal-ui-actions.ts'
import { PmButton } from '@/components/ui/pm-button'

type CreateDealButtonProps = {
  readonly negotiation: Negotiation | null | undefined
  readonly className?: string
  readonly variant?: 'default' | 'outline' | 'secondary'
  readonly size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function CreateDealButton({
  negotiation,
  className,
  variant = 'default',
  size = 'default',
}: CreateDealButtonProps) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  if (!canShowCreateDealFromNegotiation(negotiation)) {
    return null
  }

  const handleCreateDeal = () => {
    if (!negotiation?.id || pending) return
    setPending(true)
    const result = createDealFromNegotiationUiAction(negotiation.id)
    setPending(false)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    toast.success('Deal created', {
      description: 'Draft deal workspace is ready.',
    })
    navigate(`/deals/${result.dealId}`)
  }

  return (
    <PmButton
      type="button"
      variant={variant}
      size={size}
      className={className ?? 'cursor-pointer'}
      disabled={pending}
      onClick={handleCreateDeal}
    >
      {pending ? 'Creating deal…' : 'Create deal'}
    </PmButton>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { Negotiation } from '@/types/domain.ts'
import {
  canShowCreateCommercialAgreementFromNegotiation,
  createCommercialAgreementFromNegotiationUiAction,
} from '@/lib/create-commercial-agreement-ui-actions.ts'
import { PmButton } from '@/components/ui/pm-button'

type CreateCommercialAgreementButtonProps = {
  readonly negotiation: Negotiation | null | undefined
  readonly className?: string
  readonly variant?: 'default' | 'outline' | 'secondary'
  readonly size?: 'default' | 'sm' | 'lg' | 'icon'
}

export const CREATE_COMMERCIAL_AGREEMENT_LABEL = 'Create Commercial Agreement'
export const CREATING_COMMERCIAL_AGREEMENT_LABEL = 'Creating Commercial Agreement...'

export function CreateCommercialAgreementButton({
  negotiation,
  className,
  variant = 'default',
  size = 'default',
}: CreateCommercialAgreementButtonProps) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  if (!canShowCreateCommercialAgreementFromNegotiation(negotiation)) {
    return null
  }

  const handleCreate = () => {
    if (!negotiation?.id || pending) return
    setPending(true)
    const result = createCommercialAgreementFromNegotiationUiAction(negotiation.id)
    setPending(false)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    toast.success('Commercial agreement created', {
      description: 'Draft commercial agreement workspace is ready.',
    })
    navigate(`/commercial-agreements/${result.commercialAgreementId}`)
  }

  return (
    <PmButton
      type="button"
      variant={variant}
      size={size}
      className={className ?? 'cursor-pointer'}
      disabled={pending}
      onClick={handleCreate}
    >
      {pending ? CREATING_COMMERCIAL_AGREEMENT_LABEL : CREATE_COMMERCIAL_AGREEMENT_LABEL}
    </PmButton>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CONTRACT_DETAIL_ROUTE_PREFIX } from '@/lib/commercial-agreement-detail-read-model.ts'
import { createContractFromCommercialAgreementUiAction } from '@/lib/create-contract-ui-actions.ts'
import { PmButton } from '@/components/ui/pm-button'

type CreateContractButtonProps = {
  readonly commercialAgreementId: string
  readonly className?: string
  readonly variant?: 'default' | 'outline' | 'secondary'
}

export function CreateContractButton({
  commercialAgreementId,
  className,
  variant = 'default',
}: CreateContractButtonProps) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  const handleCreateContract = () => {
    if (!commercialAgreementId || pending) return
    setPending(true)
    const result = createContractFromCommercialAgreementUiAction(commercialAgreementId)
    setPending(false)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    toast.success('Contract created', {
      description: 'Draft contract is ready for review and signing.',
    })
    navigate(`${CONTRACT_DETAIL_ROUTE_PREFIX}/${result.contractId}`)
  }

  return (
    <PmButton
      type="button"
      variant={variant}
      className={className ?? 'cursor-pointer'}
      disabled={pending}
      onClick={handleCreateContract}
    >
      {pending ? 'Creating contract…' : 'Create contract'}
    </PmButton>
  )
}

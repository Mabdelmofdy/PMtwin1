import { useState } from 'react'
import { toast } from 'sonner'
import { completeContractUiAction } from '@/lib/complete-contract-ui-actions.ts'
import { PmButton } from '@/components/ui/pm-button'

type CompleteContractButtonProps = {
  readonly contractId: string
  readonly className?: string
  readonly variant?: 'default' | 'outline' | 'secondary'
}

export function CompleteContractButton({
  contractId,
  className,
  variant = 'default',
}: CompleteContractButtonProps) {
  const [pending, setPending] = useState(false)

  const handleCompleteContract = () => {
    if (!contractId || pending) return
    setPending(true)
    const result = completeContractUiAction(contractId)
    setPending(false)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    toast.success('Contract completed', {
      description: 'The contract has been marked as completed.',
    })
  }

  return (
    <PmButton
      type="button"
      variant={variant}
      className={className ?? 'cursor-pointer'}
      disabled={pending}
      onClick={handleCompleteContract}
    >
      {pending ? 'Completing contract…' : 'Complete contract'}
    </PmButton>
  )
}

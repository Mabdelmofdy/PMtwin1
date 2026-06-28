import { useState } from 'react'
import { toast } from 'sonner'
import { terminateContractUiAction } from '@/lib/terminate-contract-ui-actions.ts'
import { Button } from '@/components/ui/button'

type TerminateContractButtonProps = {
  readonly contractId: string
  readonly className?: string
}

export function TerminateContractButton({
  contractId,
  className,
}: TerminateContractButtonProps) {
  const [pending, setPending] = useState(false)

  const handleTerminateContract = () => {
    if (!contractId || pending) return
    setPending(true)
    const result = terminateContractUiAction(contractId)
    setPending(false)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    toast.success('Contract terminated', {
      description: 'The contract has been terminated.',
    })
  }

  return (
    <Button
      type="button"
      variant="destructive"
      className={className ?? 'cursor-pointer'}
      disabled={pending}
      onClick={handleTerminateContract}
    >
      {pending ? 'Terminating contract…' : 'Terminate contract'}
    </Button>
  )
}

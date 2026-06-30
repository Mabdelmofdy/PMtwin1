import { useState } from 'react'
import { toast } from 'sonner'
import { signContractUiAction } from '@/lib/sign-contract-ui-actions.ts'
import { PmButton } from '@/components/ui/pm-button'

type SignContractButtonProps = {
  readonly contractId: string
  readonly userId: string
  readonly className?: string
  readonly variant?: 'default' | 'outline' | 'secondary'
}

export function SignContractButton({
  contractId,
  userId,
  className,
  variant = 'default',
}: SignContractButtonProps) {
  const [pending, setPending] = useState(false)

  const handleSignContract = () => {
    if (!contractId || !userId || pending) return
    setPending(true)
    const result = signContractUiAction(contractId, userId)
    setPending(false)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    toast.success('Contract signed', {
      description:
        result.contract.status === 'active'
          ? 'All parties have signed. The contract is now active.'
          : 'Your signature has been recorded. Awaiting remaining parties.',
    })
  }

  return (
    <PmButton
      type="button"
      variant={variant}
      className={className ?? 'cursor-pointer'}
      disabled={pending}
      onClick={handleSignContract}
    >
      {pending ? 'Signing contract…' : 'Sign contract'}
    </PmButton>
  )
}

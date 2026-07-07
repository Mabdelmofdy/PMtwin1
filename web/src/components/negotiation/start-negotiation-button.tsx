import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { PostMatch } from '@/types/domain.ts'
import {
  canShowStartNegotiationFromPostMatch,
  startNegotiationFromPostMatchUiAction,
} from '@/lib/start-negotiation-ui-actions.ts'
import { PmButton } from '@/components/ui/pm-button'

type StartNegotiationButtonProps = {
  readonly match: PostMatch | null | undefined
  readonly className?: string
  readonly variant?: 'default' | 'outline' | 'secondary'
  readonly size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function StartNegotiationButton({
  match,
  className,
  variant = 'default',
  size = 'default',
}: StartNegotiationButtonProps) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  if (!canShowStartNegotiationFromPostMatch(match)) {
    return null
  }

  const handleStart = () => {
    if (!match?.id || pending) return
    setPending(true)
    const result = startNegotiationFromPostMatchUiAction(match.id)
    setPending(false)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    toast.success('Negotiation started', {
      description: 'You can agree terms or create a commercial agreement when ready.',
    })
    navigate(`/negotiations/${result.negotiationId}`)
  }

  return (
    <PmButton
      type="button"
      variant={variant}
      size={size}
      className={className ?? 'cursor-pointer'}
      disabled={pending}
      onClick={handleStart}
    >
      {pending ? 'Starting negotiation…' : 'Start negotiation'}
    </PmButton>
  )
}

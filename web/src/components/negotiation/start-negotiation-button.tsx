import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { PostMatch } from '@/types/domain.ts'
import {
  canShowStartNegotiationFromPostMatch,
  startNegotiationFromPostMatchUiAction,
} from '@/lib/start-negotiation-ui-actions.ts'
import { Button } from '@/components/ui/button'

type StartNegotiationButtonProps = {
  readonly match: PostMatch | null | undefined
  readonly className?: string
  readonly variant?: 'default' | 'outline' | 'secondary'
}

export function StartNegotiationButton({
  match,
  className,
  variant = 'default',
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
      description: 'You can agree terms or create a deal when ready.',
    })
    navigate(`/negotiations/${result.negotiationId}`)
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={className ?? 'cursor-pointer'}
      disabled={pending}
      onClick={handleStart}
    >
      {pending ? 'Starting negotiation…' : 'Start negotiation'}
    </Button>
  )
}

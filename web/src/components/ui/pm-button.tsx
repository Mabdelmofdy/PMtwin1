import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { pmInteraction, pmMotion } from '@/tokens'
import { Button, buttonVariants } from '@/components/ui/button'

export type PmButtonProps = ComponentProps<typeof Button>

export function PmButton({ className, ...props }: PmButtonProps) {
  return (
    <Button
      data-slot="pm-button"
      className={cn(
        pmMotion.fast,
        pmInteraction.hover,
        pmInteraction.press,
        'rounded-xl pm-focus-ring shadow-sm hover:shadow-md',
        className,
      )}
      {...props}
    />
  )
}

export { buttonVariants as pmButtonVariants }

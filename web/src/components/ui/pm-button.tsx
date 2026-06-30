import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { pmMotion } from '@/components/shared/pm-design-tokens'
import { Button, buttonVariants } from '@/components/ui/button'

export type PmButtonProps = ComponentProps<typeof Button>

export function PmButton({ className, ...props }: PmButtonProps) {
  return (
    <Button
      data-slot="pm-button"
      className={cn(
        pmMotion.fast,
        'rounded-lg pm-focus-ring',
        className,
      )}
      {...props}
    />
  )
}

export { buttonVariants as pmButtonVariants }

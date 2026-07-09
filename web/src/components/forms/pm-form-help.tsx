import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type PmFormHelpProps = ComponentProps<'p'>

/** Helper text below a field — linked via aria-describedby. */
export function PmFormHelp({ className, children, ...props }: PmFormHelpProps) {
  return (
    <p
      data-slot="pm-form-help"
      className={cn(pmTypography.caption, 'text-muted-foreground', className)}
      {...props}
    >
      {children}
    </p>
  )
}

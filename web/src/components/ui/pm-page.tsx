import { PmPageLayout, type PmPageLayoutProps } from '@/components/layout/pm-page-layout'
import { cn } from '@/lib/utils'

export type PmPageProps = PmPageLayoutProps

/**
 * Top-level authenticated page wrapper — standardizes PmPageLayout spacing.
 * Use with PmPageHeader in the `header` slot.
 */
export function PmPage({ contentClassName, ...props }: PmPageProps) {
  return (
    <PmPageLayout
      {...props}
      contentClassName={cn('min-w-0', contentClassName)}
    />
  )
}

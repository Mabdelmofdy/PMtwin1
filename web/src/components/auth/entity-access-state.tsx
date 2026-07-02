import { Link } from 'react-router-dom'
import { PmButton, PmEmptyState } from '@/components/ui/pm-index'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'

type EntityAccessDeniedProps = {
  readonly title?: string
  readonly description?: string
  readonly backHref?: string
  readonly backLabel?: string
}

export function EntityAccessDenied({
  title = 'Access denied',
  description = 'You do not have permission to view this record.',
  backHref = '/dashboard',
  backLabel = 'Back to dashboard',
}: EntityAccessDeniedProps) {
  return (
    <PmEmptyState
      title={title}
      description={description}
      action={
        <PmButton size="sm" variant="outline" asChild>
          <Link to={backHref}>{backLabel}</Link>
        </PmButton>
      }
    />
  )
}

type EntityLimitedViewBannerProps = {
  readonly message: string
}

export function EntityLimitedViewBanner({ message }: EntityLimitedViewBannerProps) {
  return (
    <p className={cn(pmTypography.bodySm, 'rounded-md border border-border/60 bg-muted/30 px-4 py-3 text-muted-foreground')}>
      {message}
    </p>
  )
}

import { Link } from 'react-router-dom'
import { PmButton, PmEmptyState } from '@/components/ui/pm-index'
import {
  resolveEntityBrowseBackHref,
  resolveEntityBrowseBackLabel,
  type WorkflowEntityBrowseKey,
} from '@/components/auth/entity-browse-routes'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'

type EntityAccessDeniedProps = {
  readonly title?: string
  readonly description?: string
  readonly entity?: WorkflowEntityBrowseKey
  readonly backHref?: string
  readonly backLabel?: string
}

export function EntityAccessDenied({
  title = 'Access denied',
  description = 'You do not have permission to view this record.',
  entity,
  backHref,
  backLabel,
}: EntityAccessDeniedProps) {
  const resolvedHref =
    backHref ?? (entity ? resolveEntityBrowseBackHref(entity) : '/dashboard')
  const resolvedLabel =
    backLabel ?? (entity ? resolveEntityBrowseBackLabel(entity) : 'Back to dashboard')

  return (
    <div data-slot="pm-access-denied">
      <PmEmptyState
        title={title}
        description={description}
        action={
          <PmButton size="sm" variant="outline" asChild>
            <Link to={resolvedHref}>{resolvedLabel}</Link>
          </PmButton>
        }
      />
    </div>
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

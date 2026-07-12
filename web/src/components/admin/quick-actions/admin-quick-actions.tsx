import { Link } from 'react-router-dom'
import type { AdminQuickActionDefinition } from '@/domain/admin/read-models/types.ts'
import { PmButton } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'

export type AdminQuickActionsProps = {
  readonly actions: readonly AdminQuickActionDefinition[]
  readonly onAction?: (id: string) => void
  readonly hasPermission?: (capability: string) => boolean
  readonly className?: string
}

export function AdminQuickActions({
  actions,
  onAction,
  hasPermission,
  className,
}: AdminQuickActionsProps) {
  if (actions.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="group" aria-label="Quick actions">
      {actions.map((action) => {
        const allowed = hasPermission ? hasPermission(action.requiredPermission) : true
        const variant = action.sensitive ? 'destructive' : 'outline'

        if (action.href && allowed) {
          return (
            <PmButton
              key={action.id}
              asChild
              size="sm"
              variant={variant}
              className={action.sensitive ? 'border-danger/40' : undefined}
            >
              <Link
                to={action.href}
                onClick={() => onAction?.(action.id)}
              >
                {action.label}
              </Link>
            </PmButton>
          )
        }

        return (
          <PmButton
            key={action.id}
            type="button"
            size="sm"
            variant={variant}
            disabled={!allowed}
            className={action.sensitive ? 'border-danger/40' : undefined}
            onClick={() => onAction?.(action.id)}
          >
            {action.label}
          </PmButton>
        )
      })}
    </div>
  )
}

import { Link } from 'react-router-dom'
import type { AdminPlatformEntityDefinition } from '@/domain/admin/read-models/types.ts'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge, PmEmptyState } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type AdminEntityCatalogueProps = {
  readonly entities: readonly AdminPlatformEntityDefinition[]
  readonly title?: string
  readonly className?: string
}

export function AdminEntityCatalogue({
  entities,
  title = 'Platform entities',
  className,
}: AdminEntityCatalogueProps) {
  return (
    <PmContentCard title={title} className={className}>
      {entities.length === 0 ? (
        <PmEmptyState
          title="No entities"
          description="Platform entity definitions will appear here."
          size="compact"
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {entities.map((entity) => (
            <li key={entity.entityType}>
              <Link
                to={entity.href}
                className={cn(
                  'flex h-full flex-col gap-2 rounded-xl border border-border/60 bg-gradient-to-b from-card to-surface p-4',
                  'transition-colors hover:border-primary/40 hover:bg-muted/30',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={pmTypography.label}>{entity.label}</p>
                  {entity.readOnly ? (
                    <PmBadge tone="muted" size="sm">
                      read-only
                    </PmBadge>
                  ) : null}
                </div>
                <p className={cn(pmTypography.caption, 'text-muted-foreground line-clamp-2')}>
                  {entity.description}
                </p>
                <p className={cn(pmTypography.stat, 'mt-auto pt-2')}>{entity.recordCount}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PmContentCard>
  )
}

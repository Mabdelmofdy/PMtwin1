import { Link } from 'react-router-dom'
import type { AdminGlobalSearchResult } from '@/domain/admin/read-models/types.ts'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge, PmEmptyState } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type AdminSearchResultsProps = {
  readonly results: readonly AdminGlobalSearchResult[]
  readonly title?: string
  readonly className?: string
}

function groupByEntityType(
  results: readonly AdminGlobalSearchResult[],
): readonly { readonly entityType: string; readonly items: readonly AdminGlobalSearchResult[] }[] {
  const order: string[] = []
  const map = new Map<string, AdminGlobalSearchResult[]>()

  for (const result of [...results].sort((a, b) => b.rank - a.rank)) {
    const existing = map.get(result.entityType)
    if (existing) {
      existing.push(result)
    } else {
      map.set(result.entityType, [result])
      order.push(result.entityType)
    }
  }

  return order.map((entityType) => ({
    entityType,
    items: map.get(entityType) ?? [],
  }))
}

export function AdminSearchResults({
  results,
  title = 'Search results',
  className,
}: AdminSearchResultsProps) {
  const groups = groupByEntityType(results)

  return (
    <PmContentCard title={title} className={className}>
      {groups.length === 0 ? (
        <PmEmptyState
          title="No results"
          description="Try a different search term."
          size="compact"
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.entityType} aria-label={group.entityType}>
              <h3 className={cn(pmTypography.label, 'mb-2 text-muted-foreground')}>
                {group.entityType}
              </h3>
              <ul className="divide-y divide-border/50" role="list">
                {group.items.map((result) => (
                  <li key={result.id}>
                    <Link
                      to={result.href}
                      className={cn(
                        'flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between',
                        'transition-colors hover:bg-muted/40',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      )}
                    >
                      <div className="min-w-0 space-y-1">
                        <p className={cn(pmTypography.label, 'truncate')}>
                          {result.masked ? '••••••••' : result.primaryLabel}
                        </p>
                        {result.secondaryContext ? (
                          <p className={cn(pmTypography.caption, 'text-muted-foreground line-clamp-1')}>
                            {result.secondaryContext}
                          </p>
                        ) : null}
                        {result.relatedPartyLabel ? (
                          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                            {result.relatedPartyLabel}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {result.status ? (
                          <PmBadge tone="muted" size="sm">
                            {result.status}
                          </PmBadge>
                        ) : null}
                        <PmBadge tone="info" size="sm">
                          {result.environment}
                        </PmBadge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PmContentCard>
  )
}

import { Link } from 'react-router-dom'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmEmptyState } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type AdminDomainNavTile = {
  readonly label: string
  readonly href: string
  readonly description?: string
}

export type AdminDomainNavTilesProps = {
  readonly tiles: readonly AdminDomainNavTile[]
  readonly title?: string
  readonly className?: string
}

/** Operational domain navigation — tiles, not plain hyperlinks. */
export function AdminDomainNavTiles({
  tiles,
  title = 'Domain navigation',
  className,
}: AdminDomainNavTilesProps) {
  return (
    <PmContentCard title={title} className={className}>
      {tiles.length === 0 ? (
        <PmEmptyState title="No destinations" size="compact" />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <Link
              key={tile.href}
              to={tile.href}
              className={cn(
                'rounded-lg border border-border/60 bg-card p-3 transition-colors',
                'hover:border-primary/40 hover:bg-muted/30',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <p className={pmTypography.label}>{tile.label}</p>
              {tile.description ? (
                <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
                  {tile.description}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </PmContentCard>
  )
}

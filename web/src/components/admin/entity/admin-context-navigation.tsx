import { Link } from 'react-router-dom'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type AdminContextNavNode = {
  readonly id: string
  readonly label: string
  readonly href?: string
  readonly meta?: string
  readonly current?: boolean
}

export type AdminContextNavigationProps = {
  readonly title?: string
  readonly nodes: readonly AdminContextNavNode[]
  readonly className?: string
}

/** Clickable operational graph for admin entity details. */
export function AdminContextNavigation({
  title = 'Operational context',
  nodes,
  className,
}: AdminContextNavigationProps) {
  if (nodes.length === 0) return null

  return (
    <PmContentCard title={title} className={className}>
      <ol className="space-y-0" aria-label={title}>
        {nodes.map((node, index) => {
          const body = (
            <div
              className={cn(
                'rounded-md border px-3 py-2',
                node.current
                  ? 'border-primary/40 bg-primary/[0.06]'
                  : 'border-border/60 bg-card',
              )}
            >
              <p className={pmTypography.label}>{node.label}</p>
              {node.meta ? (
                <p className={cn(pmTypography.caption, 'text-muted-foreground')}>{node.meta}</p>
              ) : null}
            </div>
          )
          return (
            <li key={node.id} className="relative">
              {index > 0 ? (
                <div
                  className="flex justify-center py-1 text-muted-foreground"
                  aria-hidden
                >
                  ↓
                </div>
              ) : null}
              {node.href && !node.current ? (
                <Link
                  to={node.href}
                  className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          )
        })}
      </ol>
    </PmContentCard>
  )
}

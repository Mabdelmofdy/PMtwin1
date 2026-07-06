import { Link } from 'react-router-dom'
import { PmContentCard } from '@/components/layout/pm-layout-panels'
import { PmButton } from '@/components/ui/pm-button'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'

export type PmWorkflowLink = {
  readonly id: string
  readonly label: string
  readonly href: string
}

export type PmWorkflowLinksCardProps = {
  readonly links: readonly PmWorkflowLink[]
  readonly title?: string
  readonly emptyMessage?: string
  readonly className?: string
}

const DEFAULT_TITLE = 'Workflow links'
const DEFAULT_SURFACE_CLASS = 'border-border/60 bg-surface-muted/30'

/**
 * Related workflow entity links on detail pages (match → negotiation → deal → contract).
 */
export function PmWorkflowLinksCard({
  links,
  title = DEFAULT_TITLE,
  emptyMessage,
  className,
}: PmWorkflowLinksCardProps) {
  if (links.length === 0 && !emptyMessage) {
    return null
  }

  return (
    <PmContentCard
      data-slot="pm-workflow-links-card"
      title={title}
      className={cn(DEFAULT_SURFACE_CLASS, className)}
    >
      {links.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <PmButton key={link.id} size="sm" variant="outline" asChild>
              <Link to={link.href}>{link.label}</Link>
            </PmButton>
          ))}
        </div>
      ) : emptyMessage ? (
        <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>{emptyMessage}</p>
      ) : null}
    </PmContentCard>
  )
}

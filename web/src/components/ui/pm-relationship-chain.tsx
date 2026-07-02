import { Link } from 'react-router-dom'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'

export type PmRelationshipChainItem = {
  label: string
  href?: string
  current?: boolean
}

type PmRelationshipChainProps = {
  title?: string
  description?: string
  items: readonly PmRelationshipChainItem[]
}

export function PmRelationshipChain({
  title = 'Relationship chain',
  description,
  items,
}: PmRelationshipChainProps) {
  return (
    <PmContentCard title={title} description={description}>
      <ol className="space-y-2">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className={cn(pmTypography.bodySm, 'text-foreground')}>
            {item.href ? (
              <Link to={item.href} className={cn('font-medium text-primary hover:underline')}>
                {item.label}
              </Link>
            ) : item.current ? (
              <span className="font-medium">{item.label}</span>
            ) : (
              <span>{item.label}</span>
            )}
            {index < items.length - 1 ? (
              <span className={cn('mx-2 text-muted-foreground')} aria-hidden>
                {'->'}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </PmContentCard>
  )
}

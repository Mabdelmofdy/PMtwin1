import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { PmPage } from '@/components/ui/pm-page'

export type PmBrowsePageProps = {
  readonly header: ReactNode
  readonly summary?: ReactNode
  readonly toolbar?: ReactNode
  readonly children: ReactNode
  readonly pagination?: ReactNode
  readonly className?: string
  readonly contentClassName?: string
}

/**
 * Authenticated browse archetype — Header → Summary → Toolbar → Content → Pagination.
 * Presentation-only scaffold; data fetching stays in page modules.
 */
export function PmBrowsePage({
  header,
  summary,
  toolbar,
  children,
  pagination,
  className,
  contentClassName,
}: PmBrowsePageProps) {
  return (
    <div data-slot="pm-browse-page" className={cn('min-w-0', className)}>
      <PmPage
        header={header}
        toolbar={toolbar}
        contentClassName={cn('min-w-0 space-y-6', contentClassName)}
      >
        {summary ? (
          <section data-slot="pm-browse-summary" className="min-w-0">
            {summary}
          </section>
        ) : null}
        <div data-slot="pm-browse-content" className="min-w-0 space-y-4">
          {children}
        </div>
        {pagination ? (
          <footer data-slot="pm-browse-pagination" className="min-w-0">
            {pagination}
          </footer>
        ) : null}
      </PmPage>
    </div>
  )
}

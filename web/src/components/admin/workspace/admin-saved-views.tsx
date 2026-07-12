import { PmButton } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'

export type AdminSavedView = {
  readonly id: string
  readonly label: string
}

export type AdminSavedViewsProps = {
  readonly views: readonly AdminSavedView[]
  readonly activeId?: string
  readonly onSelect?: (id: string) => void
  readonly className?: string
}

export function AdminSavedViews({
  views,
  activeId,
  onSelect,
  className,
}: AdminSavedViewsProps) {
  if (views.length === 0) return null

  return (
    <div
      role="tablist"
      aria-label="Saved views"
      className={cn('flex flex-wrap gap-2', className)}
    >
      {views.map((view) => {
        const active = view.id === activeId
        return (
          <PmButton
            key={view.id}
            type="button"
            size="sm"
            variant={active ? 'default' : 'outline'}
            aria-selected={active}
            role="tab"
            onClick={() => onSelect?.(view.id)}
          >
            {view.label}
          </PmButton>
        )
      })}
    </div>
  )
}

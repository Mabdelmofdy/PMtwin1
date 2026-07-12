import type { ReactNode } from 'react'
import { PmBadge, PmPageHeader } from '@/components/ui/pm-index'

export type AdminWorkspaceHeaderProps = {
  readonly title: string
  readonly description?: string
  readonly badges?: ReactNode
  readonly actions?: ReactNode
  readonly environmentLabel?: string
  readonly className?: string
}

export function AdminWorkspaceHeader({
  title,
  description,
  badges,
  actions,
  environmentLabel,
  className,
}: AdminWorkspaceHeaderProps) {
  const badgeRow =
    environmentLabel || badges ? (
      <>
        {environmentLabel ? <PmBadge tone="info">{environmentLabel}</PmBadge> : null}
        {badges}
      </>
    ) : undefined

  return (
    <PmPageHeader
      label="Admin workspace"
      title={title}
      description={description}
      badges={badgeRow}
      actions={actions}
      className={className}
    />
  )
}

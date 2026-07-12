import type { ReactNode } from 'react'
import { PmContentCard } from '@/components/layout/pm-layout-index'

export type AdminDataViewProps = {
  readonly title?: string
  readonly description?: string
  readonly actions?: ReactNode
  readonly children: ReactNode
  readonly className?: string
}

export function AdminDataView({
  title,
  description,
  actions,
  children,
  className,
}: AdminDataViewProps) {
  return (
    <PmContentCard
      title={title}
      description={description}
      actions={actions}
      className={className}
    >
      {children}
    </PmContentCard>
  )
}

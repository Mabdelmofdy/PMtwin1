import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ContentContainerProps = {
  children: ReactNode
  className?: string
  /** Tighter padding for dense data views */
  dense?: boolean
}

export function ContentContainer({
  children,
  className,
  dense = false,
}: ContentContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-7xl flex-1',
        dense ? 'px-4 py-4 md:px-6 md:py-6' : 'px-4 py-6 md:px-8 md:py-8',
        className,
      )}
    >
      {children}
    </div>
  )
}

import type { ReactNode } from 'react'
import { AppPageChrome } from '@/components/layout/page-chrome'

type ContentContainerProps = {
  children: ReactNode
  className?: string
  dense?: boolean
}

/**
 * @deprecated Prefer AppPageChrome inside AppShell. Kept for compatibility.
 */
export function ContentContainer({
  children,
  className,
  dense = false,
}: ContentContainerProps) {
  return (
    <AppPageChrome dense={dense} className={className} animate={false}>
      {children}
    </AppPageChrome>
  )
}

import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmLayoutGrid, pmContentWidth } from '@/components/shared/pm-layout-tokens'

export type PmContentLayoutProps = ComponentProps<'div'> & {
  width?: keyof typeof pmContentWidth
  dense?: boolean
  children?: ReactNode
}

/** Width-constrained main content column with PM page padding. */
export function PmContentLayout({
  width = 'default',
  dense = false,
  className,
  children,
  ...props
}: PmContentLayoutProps) {
  return (
    <div
      data-slot="pm-content-layout"
      className={cn(
        pmContentWidth[width],
        dense ? 'px-4 py-4 md:px-6 md:py-6' : 'pm-page-padding',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export type PmPageLayoutProps = {
  header?: ReactNode
  toolbar?: ReactNode
  children: ReactNode
  inspector?: ReactNode
  activity?: ReactNode
  actionBar?: ReactNode
  className?: string
  contentClassName?: string
  /** When true, main + inspector use detail grid */
  withInspector?: boolean
}

/**
 * Top-level page scaffold:
 * Header → Toolbar → Content (± Inspector) → Activity → ActionBar
 */
export function PmPageLayout({
  header,
  toolbar,
  children,
  inspector,
  activity,
  actionBar,
  className,
  contentClassName,
  withInspector = Boolean(inspector),
}: PmPageLayoutProps) {
  return (
    <div
      data-slot="pm-page-layout"
      className={cn(pmLayoutGrid.pageStack, 'min-w-0', className)}
    >
      {header}
      {toolbar}
      {withInspector && inspector ? (
        <div className={cn(pmLayoutGrid.detail, contentClassName)}>
          <div className={pmLayoutGrid.detailMain}>{children}</div>
          <aside className={pmLayoutGrid.detailInspector}>{inspector}</aside>
        </div>
      ) : (
        <div className={contentClassName}>{children}</div>
      )}
      {activity}
      {actionBar}
    </div>
  )
}

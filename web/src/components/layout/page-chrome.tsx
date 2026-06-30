import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { pmContentWidth } from '@/components/shared/pm-layout-tokens'

type AppPageChromeProps = {
  children: ReactNode
  className?: string
  dense?: boolean
  animate?: boolean
}

/** Standard page content chrome inside AppShell — spacing + optional enter motion. */
export function AppPageChrome({
  children,
  className,
  dense = false,
  animate = true,
}: AppPageChromeProps) {
  const body = (
    <div
      data-slot="app-page-chrome"
      className={cn(
        pmContentWidth.default,
        'flex-1',
        dense ? 'px-4 py-4 md:px-6 md:py-6' : 'pm-page-padding',
        className,
      )}
    >
      {children}
    </div>
  )

  if (!animate) return body

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {body}
    </motion.div>
  )
}

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { pmContentWidth } from '@/components/shared/pm-layout-tokens'
import { pmResponsive } from '@/tokens'
import { pmPageEnterVariants } from '@/components/motion/pm-motion-presets'
import { usePmReducedMotion } from '@/components/motion/use-pm-reduced-motion'

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
  const reducedMotion = usePmReducedMotion()
  const body = (
    <div
      data-slot="app-page-chrome"
      className={cn(
        pmContentWidth.default,
        pmResponsive.pageChrome,
        'flex-1',
        dense ? 'px-4 py-4 md:px-6 md:py-6' : 'pm-page-padding',
        className,
      )}
    >
      {children}
    </div>
  )

  if (!animate) return body

  const motionProps = pmPageEnterVariants(reducedMotion)

  return (
    <motion.div className="min-w-0 max-w-full" {...motionProps}>
      {body}
    </motion.div>
  )
}

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useMarketingMotion } from '@/components/marketing/marketing-motion'

type MarketingHeroProps = {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  visual?: ReactNode
  className?: string
  /** Compact variant for auth-adjacent marketing columns. */
  compact?: boolean
  /** Centered single-column hero (e.g. collaboration models). */
  centered?: boolean
}

export function MarketingHero({
  eyebrow,
  title,
  subtitle,
  description,
  actions,
  visual,
  className,
  compact = false,
  centered = false,
}: MarketingHeroProps) {
  const { heroStagger, heroText, heroVisualFloat, reducedMotion } = useMarketingMotion()

  return (
    <section
      className={cn(
        'mkt-hero',
        compact && 'mkt-hero--compact',
        centered && 'mkt-hero--centered',
        className,
      )}
      aria-labelledby="mkt-hero-title"
    >
      <div className="mkt-hero-grid" aria-hidden="true" />
      <div className={cn('mkt-hero-shell', centered && 'mkt-hero-shell--centered')}>
        <motion.div
          className="mkt-hero-copy"
          initial="hidden"
          animate="visible"
          variants={heroStagger}
        >
          {eyebrow ? (
            <motion.p className="mkt-eyebrow mkt-hero-eyebrow" variants={heroText}>
              {eyebrow}
            </motion.p>
          ) : null}
          <motion.h1 id="mkt-hero-title" className="mkt-hero-title" variants={heroText}>
            {title}
          </motion.h1>
          {subtitle ? (
            <motion.p className="mkt-hero-subtitle" variants={heroText}>
              {subtitle}
            </motion.p>
          ) : null}
          {description ? (
            <motion.p className="mkt-hero-description" variants={heroText}>
              {description}
            </motion.p>
          ) : null}
          {actions ? (
            <motion.div className="mkt-hero-actions" variants={heroText}>
              {actions}
            </motion.div>
          ) : null}
        </motion.div>

        {visual ? (
          <motion.div
            className="mkt-hero-visual"
            aria-hidden={centered ? undefined : true}
            {...(!reducedMotion ? heroVisualFloat : {})}
          >
            {visual}
          </motion.div>
        ) : null}
      </div>
    </section>
  )
}

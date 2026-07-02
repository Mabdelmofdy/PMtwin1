import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useMarketingMotion } from '@/components/marketing/marketing-motion'

type MarketingSectionProps = {
  children: ReactNode
  className?: string
  id?: string
  eyebrow?: string
  title?: string
  subtitle?: string
  /** When false, children render without scroll reveal wrapper. */
  animate?: boolean
  /** Wider container for hero-adjacent sections. */
  wide?: boolean
}

/** Scroll-reveal wrapper without extra section chrome — for legacy page sections. */
export function MarketingReveal({
  children,
  className,
  as = 'section',
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div'
  id?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}) {
  const { fadeUp, viewport } = useMarketingMotion()
  const Component = motion[as]
  return (
    <Component
      className={className}
      id={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={fadeUp}
    >
      {children}
    </Component>
  )
}

export function MarketingSection({
  children,
  className,
  id,
  eyebrow,
  title,
  subtitle,
  animate = true,
  wide = false,
}: MarketingSectionProps) {
  const { fadeUp, viewport } = useMarketingMotion()

  const header =
    eyebrow || title || subtitle ? (
      <header className="mkt-section-header">
        {eyebrow ? <p className="mkt-eyebrow">{eyebrow}</p> : null}
        {title ? <h2 className="mkt-section-title">{title}</h2> : null}
        {subtitle ? <p className="mkt-section-subtitle">{subtitle}</p> : null}
      </header>
    ) : null

  const inner = (
    <div className={cn('mkt-section-inner', wide && 'mkt-section-inner--wide', className)}>
      {header}
      {children}
    </div>
  )

  if (!animate) {
    return (
      <section className="mkt-section" id={id}>
        {inner}
      </section>
    )
  }

  return (
    <motion.section
      className="mkt-section"
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={fadeUp}
    >
      {inner}
    </motion.section>
  )
}

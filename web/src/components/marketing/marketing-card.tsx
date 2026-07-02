import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useMarketingMotion } from '@/components/marketing/marketing-motion'

type MarketingCardProps = {
  title: ReactNode
  children: ReactNode
  icon?: ReactNode
  index?: string
  cta?: { label: string; href: string }
  className?: string
  /** When true, card is a motion stagger child (parent must be stagger container). */
  asStaggerItem?: boolean
}

export function MarketingCard({
  title,
  children,
  icon,
  index,
  cta,
  className,
  asStaggerItem = false,
}: MarketingCardProps) {
  const { cardHover, staggerItem } = useMarketingMotion()

  const body = (
    <>
      <div className="mkt-card-top">
        {index ? <span className="mkt-card-index" aria-hidden="true">{index}</span> : null}
        {icon ? <span className="mkt-card-icon" aria-hidden="true">{icon}</span> : null}
      </div>
      <h3 className="mkt-card-title">{title}</h3>
      <div className="mkt-card-body">{children}</div>
      {cta ? (
        <Link to={cta.href} className="mkt-card-cta">
          <span>{cta.label}</span>
          <i className="ph-duotone ph-arrow-right" aria-hidden="true" />
        </Link>
      ) : null}
    </>
  )

  if (asStaggerItem) {
    return (
      <motion.article
        className={cn('mkt-card', className)}
        variants={staggerItem}
        {...cardHover}
      >
        {body}
      </motion.article>
    )
  }

  return (
    <motion.article className={cn('mkt-card', className)} {...cardHover}>
      {body}
    </motion.article>
  )
}

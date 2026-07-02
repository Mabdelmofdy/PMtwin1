import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useMarketingMotion } from '@/components/marketing/marketing-motion'

type MarketingCtaBandProps = {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions: ReactNode
  className?: string
}

export function MarketingCtaBand({
  eyebrow,
  title,
  description,
  actions,
  className,
}: MarketingCtaBandProps) {
  const { fadeUp, viewport } = useMarketingMotion()

  return (
    <motion.section
      className={cn('mkt-cta-band', className)}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={fadeUp}
    >
      <div className="mkt-cta-band-inner">
        <div className="mkt-cta-band-copy">
          {eyebrow ? <p className="mkt-eyebrow mkt-cta-eyebrow">{eyebrow}</p> : null}
          <h2 className="mkt-cta-title">{title}</h2>
          {description ? <p className="mkt-cta-description">{description}</p> : null}
        </div>
        <div className="mkt-cta-band-actions">{actions}</div>
      </div>
    </motion.section>
  )
}
